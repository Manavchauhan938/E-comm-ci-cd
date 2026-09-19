import * as orderService from '../services/order.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
  const data = await orderService.createOrder({
    userId: req.user.id,
    ...req.body,
  });
  return sendSuccess(res, { status: 201, message: 'Order created', data });
});

export const listMine = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await orderService.listUserOrders(req.user.id, { page, limit });
  return sendSuccess(res, { data: result.data, meta: result.meta });
});

export const listAdmin = asyncHandler(async (req, res) => {
  const result = await orderService.listAdminOrders(req.query);
  return sendSuccess(res, { data: result.data, meta: result.meta });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await orderService.getOrder(req.params.id, {
    userId: req.user.id,
    isAdmin: req.user.role === 'ADMIN',
  });
  return sendSuccess(res, { data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updateOrderStatus(req.params.id, {
    status: req.body.status,
    note: req.body.note,
    changedBy: req.user.id,
  });
  return sendSuccess(res, { message: 'Order status updated', data });
});
