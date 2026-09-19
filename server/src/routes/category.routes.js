import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/product.validator.js';

const router = Router();

router.get('/', optionalAuth, categoryController.list);
router.get('/:slug', categoryController.getBySlug);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  categoryController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.remove);

export default router;
