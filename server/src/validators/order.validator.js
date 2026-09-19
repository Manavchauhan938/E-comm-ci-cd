import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  guestId: z.string().min(8).max(64).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

export const cartQuerySchema = z.object({
  guestId: z.string().min(8).max(64).optional(),
});

export const createAddressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(2).default('US'),
  phone: z.string().trim().max(30).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  shippingAddressId: z.string().cuid(),
  billingAddressId: z.string().cuid().optional(),
  couponCode: z.string().trim().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  guestId: z.string().min(8).max(64).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().max(500).optional().nullable(),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});

export const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid(),
});

export const refundSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().max(200).optional(),
});
