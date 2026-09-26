import Stripe from 'stripe';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { badRequest, notFound } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { toNumber } from '../utils/helpers.js';
import * as orderService from './order.service.js';

function getStripe() {
  if (!env.stripeSecretKey) {
    throw badRequest('Stripe is not configured');
  }
  return new Stripe(env.stripeSecretKey);
}

export async function createPaymentIntent(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) throw notFound('Order not found');
  if (order.userId !== userId) throw badRequest('Not your order');
  if (order.status !== 'PENDING') throw badRequest('Order is not payable');
  if (!order.payment) throw badRequest('Payment record missing');

  const stripe = getStripe();
  const amountCents = Math.round(toNumber(order.total) * 100);

  if (order.payment.stripePaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(order.payment.stripePaymentIntentId);
    return {
      clientSecret: existing.client_secret,
      paymentIntentId: existing.id,
      amount: toNumber(order.total),
      currency: order.payment.currency,
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: env.stripeCurrency,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      stripePaymentIntentId: intent.id,
      transactionId: intent.id,
      status: 'REQUIRES_ACTION',
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: toNumber(order.total),
    currency: env.stripeCurrency,
  };
}

export async function confirmPayment(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) throw notFound('Order not found');
  if (order.userId !== userId) throw badRequest('Not your order');
  if (!order.payment?.stripePaymentIntentId) {
    throw badRequest('No payment intent for this order');
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(order.payment.stripePaymentIntentId);

  if (intent.status === 'succeeded') {
    await markPaymentSucceeded(intent);
    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });
    return {
      status: 'SUCCEEDED',
      orderStatus: updated?.status ?? 'PAID',
      paymentIntentId: intent.id,
    };
  }

  if (intent.status === 'processing' || intent.status === 'requires_capture') {
    return {
      status: intent.status.toUpperCase(),
      orderStatus: order.status,
      paymentIntentId: intent.id,
    };
  }

  if (intent.status === 'requires_payment_method' || intent.status === 'canceled') {
    await markPaymentFailed(intent);
    throw badRequest(intent.last_payment_error?.message || 'Payment was not completed');
  }

  return {
    status: intent.status.toUpperCase(),
    orderStatus: order.status,
    paymentIntentId: intent.id,
  };
}

export async function handleWebhook(rawBody, signature) {
  if (!env.stripeWebhookSecret) {
    logger.warn('Stripe webhook secret not configured — ignoring webhook');
    return { received: true, ignored: true };
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed');
    throw badRequest('Invalid webhook signature');
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      await markPaymentSucceeded(intent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      await markPaymentFailed(intent);
      break;
    }
    default:
      logger.debug({ type: event.type }, 'Unhandled Stripe event');
  }

  return { received: true };
}

async function markPaymentSucceeded(intent) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: intent.id },
  });
  if (!payment) {
    logger.warn({ intentId: intent.id }, 'Payment not found for intent');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED', transactionId: intent.id },
    });
    const order = await tx.order.findUnique({ where: { id: payment.orderId } });
    if (order && order.status === 'PENDING') {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'PENDING',
          toStatus: 'PAID',
          note: 'Payment succeeded via Stripe webhook',
        },
      });
    }
  });
}

async function markPaymentFailed(intent) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: intent.id },
  });
  if (!payment) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      metadata: { lastError: intent.last_payment_error?.message ?? 'Payment failed' },
    },
  });
}

export async function refundPayment(orderId, { amount, reason } = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order?.payment) throw notFound('Order/payment not found');
  if (!['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    throw badRequest('Order is not eligible for refund');
  }
  if (!order.payment.stripePaymentIntentId) throw badRequest('No Stripe payment to refund');

  const stripe = getStripe();
  const refundAmountCents = amount
    ? Math.round(amount * 100)
    : Math.round(toNumber(order.payment.amount) * 100);

  const refund = await stripe.refunds.create({
    payment_intent: order.payment.stripePaymentIntentId,
    amount: refundAmountCents,
    reason: reason === 'requested_by_customer' ? 'requested_by_customer' : undefined,
  });

  const refundedAmount = refundAmountCents / 100;
  const full = refundedAmount >= toNumber(order.payment.amount);

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: {
      status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundId: refund.id,
      refundedAmount,
    },
  });

  if (full) {
    await orderService.updateOrderStatus(order.id, {
      status: 'CANCELLED',
      note: 'Full refund issued',
      changedBy: 'system',
    });
  }

  return {
    refundId: refund.id,
    amount: refundedAmount,
    status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
  };
}
