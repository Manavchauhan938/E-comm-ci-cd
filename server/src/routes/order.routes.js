import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  adminOrdersQuerySchema,
} from '../validators/order.validator.js';

const router = Router();

router.post('/', authenticate, validate(createOrderSchema), orderController.create);
router.get('/', authenticate, orderController.listMine);
router.get('/:id', authenticate, orderController.getOne);

export const adminOrderRouter = Router();
adminOrderRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(adminOrdersQuerySchema, 'query'),
  orderController.listAdmin
);
adminOrderRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);
adminOrderRouter.get('/:id', authenticate, authorize('ADMIN'), orderController.getOne);

export default router;
