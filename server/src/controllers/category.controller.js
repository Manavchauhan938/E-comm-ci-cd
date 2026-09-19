import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'ADMIN' && req.query.all === 'true';
  const data = await categoryService.listCategories({ includeInactive });
  return sendSuccess(res, { data });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategoryBySlug(req.params.slug);
  return sendSuccess(res, { data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body);
  return sendSuccess(res, { status: 201, message: 'Category created', data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, { message: 'Category updated', data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await categoryService.deleteCategory(req.params.id);
  return sendSuccess(res, { message: 'Category deleted', data });
});
