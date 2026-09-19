import * as productService from '../services/product.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  return sendSuccess(res, { data: result.data, meta: result.meta });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await productService.getProductBySlug(req.params.slug);
  return sendSuccess(res, { data });
});

export const create = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const data = await productService.createProduct(req.body, imagePaths);
  return sendSuccess(res, { status: 201, message: 'Product created', data });
});

export const update = asyncHandler(async (req, res) => {
  const imagePaths = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const data = await productService.updateProduct(req.params.id, req.body, imagePaths);
  return sendSuccess(res, { message: 'Product updated', data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await productService.deleteProduct(req.params.id);
  return sendSuccess(res, { message: 'Product deleted', data });
});
