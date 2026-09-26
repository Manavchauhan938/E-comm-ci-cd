import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createPaymentIntentSchema, refundSchema } from '../validators/order.validator.js';

const router = Router();

router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.createIntent
);

router.post(
  '/confirm',
  authenticate,
  validate(createPaymentIntentSchema),
  paymentController.confirm
);

router.post(
  '/refund/:orderId',
  authenticate,
  authorize('ADMIN'),
  validate(refundSchema),
  paymentController.refund
);

export default router;
