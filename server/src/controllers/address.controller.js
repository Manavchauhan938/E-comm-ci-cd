import { prisma } from '../config/prisma.js';
import { notFound, forbidden } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { createAddressSchema } from '../validators/order.validator.js';

export const listAddresses = asyncHandler(async (req, res) => {
  const data = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return sendSuccess(res, { data });
});

export const createAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, type: req.body.type },
      data: { isDefault: false },
    });
  }
  const data = await prisma.address.create({
    data: { ...req.body, userId: req.user.id },
  });
  return sendSuccess(res, { status: 201, message: 'Address created', data });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Address not found');
  if (existing.userId !== req.user.id) throw forbidden();

  if (req.body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, type: req.body.type || existing.type },
      data: { isDefault: false },
    });
  }

  const data = await prisma.address.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return sendSuccess(res, { message: 'Address updated', data });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Address not found');
  if (existing.userId !== req.user.id) throw forbidden();
  await prisma.address.delete({ where: { id: req.params.id } });
  return sendSuccess(res, { message: 'Address deleted', data: { id: req.params.id } });
});

export { createAddressSchema, validate };
