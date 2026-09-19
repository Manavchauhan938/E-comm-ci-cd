import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createIntent = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentIntent(req.body.orderId, req.user.id);
  return sendSuccess(res, { message: 'Payment intent created', data });
});

export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const data = await paymentService.handleWebhook(req.body, signature);
  return sendSuccess(res, { data });
});

export const refund = asyncHandler(async (req, res) => {
  const data = await paymentService.refundPayment(req.params.orderId, req.body);
  return sendSuccess(res, { message: 'Refund processed', data });
});
