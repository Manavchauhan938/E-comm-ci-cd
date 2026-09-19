import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartQuerySchema,
} from '../validators/order.validator.js';

const router = Router();

router.use(optionalAuth);

router.get('/', validate(cartQuerySchema, 'query'), cartController.getCart);
router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:itemId', validate(cartQuerySchema, 'query'), cartController.removeItem);

export default router;
