import * as cartService from '../services/cart.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart({
    userId: req.user?.id,
    guestId: req.query.guestId,
  });
  return sendSuccess(res, { data });
});

export const addItem = asyncHandler(async (req, res) => {
  const data = await cartService.addItem({
    userId: req.user?.id,
    guestId: req.body.guestId,
    productId: req.body.productId,
    quantity: req.body.quantity,
  });
  return sendSuccess(res, { message: 'Item added to cart', data });
});

export const updateItem = asyncHandler(async (req, res) => {
  const data = await cartService.updateItem({
    userId: req.user?.id,
    guestId: req.body.guestId ?? req.query.guestId,
    itemId: req.params.itemId,
    quantity: req.body.quantity,
  });
  return sendSuccess(res, { message: 'Cart updated', data });
});

export const removeItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeItem({
    userId: req.user?.id,
    guestId: req.query.guestId,
    itemId: req.params.itemId,
  });
  return sendSuccess(res, { message: 'Item removed', data });
});
