import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';
import { productListCache, cacheDelPrefix } from '../middleware/cache.js';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

const router = Router();

const bustProductCache = (_req, _res, next) => {
  cacheDelPrefix('products:');
  next();
};

router.get('/', validate(productQuerySchema, 'query'), productListCache, productController.list);
router.get('/:slug', productController.getBySlug);
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  uploadProductImages,
  validate(createProductSchema),
  bustProductCache,
  productController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  uploadProductImages,
  validate(updateProductSchema),
  bustProductCache,
  productController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  bustProductCache,
  productController.remove
);

export default router;
