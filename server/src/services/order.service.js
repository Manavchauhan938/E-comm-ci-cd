import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { badRequest, notFound, forbidden } from '../utils/AppError.js';
import { generateOrderNumber, toNumber } from '../utils/helpers.js';
import * as cartService from './cart.service.js';

async function applyCoupon(code, subtotal) {
  if (!code) return { discount: 0, couponCode: null };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw badRequest('Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw badRequest('Coupon expired');
  if (coupon.startsAt && coupon.startsAt > new Date()) throw badRequest('Coupon not active yet');
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw badRequest('Coupon usage limit reached');
  }
  if (coupon.minOrderAmount && subtotal < toNumber(coupon.minOrderAmount)) {
    throw badRequest(`Minimum order amount is ${coupon.minOrderAmount}`);
  }

  let discount =
    coupon.discountType === 'PERCENTAGE'
      ? (subtotal * toNumber(coupon.discountValue)) / 100
      : toNumber(coupon.discountValue);

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, toNumber(coupon.maxDiscount));
  }
  discount = Math.min(discount, subtotal);

  return { discount, couponCode: coupon.code, couponId: coupon.id };
}

function serializeOrder(order) {
  return {
    ...order,
    subtotal: toNumber(order.subtotal),
    tax: toNumber(order.tax),
    shippingCost: toNumber(order.shippingCost),
    discount: toNumber(order.discount),
    total: toNumber(order.total),
    items: order.items?.map((i) => ({
      ...i,
      unitPrice: toNumber(i.unitPrice),
      lineTotal: toNumber(i.lineTotal),
    })),
    payment: order.payment
      ? {
          ...order.payment,
          amount: toNumber(order.payment.amount),
          refundedAmount:
            order.payment.refundedAmount != null ? toNumber(order.payment.refundedAmount) : null,
        }
      : null,
  };
}

export async function createOrder({ userId, shippingAddressId, billingAddressId, couponCode, notes, guestId }) {
  const shipping = await prisma.address.findFirst({
    where: { id: shippingAddressId, userId },
  });
  if (!shipping) throw badRequest('Invalid shipping address');

  const billingId = billingAddressId || shippingAddressId;
  const billing = await prisma.address.findFirst({
    where: { id: billingId, userId },
  });
  if (!billing) throw badRequest('Invalid billing address');

  const cart = await cartService.getCart({ userId, guestId });
  if (!cart.items.length) throw badRequest('Cart is empty');

  const order = await prisma.$transaction(
    async (tx) => {
      // Lock product rows and validate stock with optimistic concurrency (version)
      const lineItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const updated = await tx.$executeRaw`
          UPDATE products
          SET stock_quantity = stock_quantity - ${item.quantity},
              version = version + 1,
              updated_at = NOW()
          WHERE id = ${item.product.id}
            AND deleted_at IS NULL
            AND is_active = true
            AND stock_quantity >= ${item.quantity}
        `;

        if (updated === 0) {
          throw badRequest(`Insufficient stock for ${item.product.name}`);
        }

        const unitPrice = item.product.price;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        lineItems.push({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      const { discount, couponCode: appliedCode, couponId } = await applyCoupon(couponCode, subtotal);
      const taxable = Math.max(subtotal - discount, 0);
      const shippingCost =
        taxable >= env.freeShippingThreshold ? 0 : env.shippingFlatRate;
      const tax = Math.round(taxable * env.taxRate * 100) / 100;
      const total = Math.round((taxable + tax + shippingCost) * 100) / 100;

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: 'PENDING',
          subtotal,
          tax,
          shippingCost,
          discount,
          total,
          couponCode: appliedCode,
          shippingAddressId,
          billingAddressId: billingId,
          notes: notes ?? null,
          items: { create: lineItems },
          statusHistory: {
            create: { fromStatus: null, toStatus: 'PENDING', note: 'Order created', changedBy: userId },
          },
          payment: {
            create: {
              provider: 'STRIPE',
              status: 'PENDING',
              amount: total,
              currency: env.stripeCurrency,
            },
          },
        },
        include: {
          items: true,
          payment: true,
          shippingAddress: true,
          billingAddress: true,
          statusHistory: true,
        },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (cart.id) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return created;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    }
  );

  return serializeOrder(order);
}

export async function listUserOrders(userId, { page = 1, limit = 20 } = {}) {
  const where = { userId };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true, payment: true },
    }),
  ]);

  return {
    data: orders.map(serializeOrder),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function listAdminOrders(query) {
  const { page, limit, status, search } = query;
  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: true,
        payment: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    data: orders.map(serializeOrder),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getOrder(id, { userId, isAdmin = false } = {}) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, slug: true, images: true } } } },
      payment: true,
      shippingAddress: true,
      billingAddress: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) throw notFound('Order not found');
  if (!isAdmin && order.userId !== userId) throw forbidden('Not your order');
  return serializeOrder(order);
}

export async function updateOrderStatus(id, { status, note, changedBy }) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound('Order not found');
  if (order.status === status) {
    return getOrder(id, { isAdmin: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status } });
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: status,
        note: note ?? null,
        changedBy,
      },
    });

    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity }, version: { increment: 1 } },
        });
      }
    }
  });

  return getOrder(id, { isAdmin: true });
}
