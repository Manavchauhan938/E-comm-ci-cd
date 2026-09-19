import { prisma } from '../config/prisma.js';
import { badRequest, notFound } from '../utils/AppError.js';
import { toNumber } from '../utils/helpers.js';

async function resolveCart({ userId, guestId }) {
  if (userId) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    // Merge guest cart if provided
    if (guestId) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestId },
        include: { items: true },
      });
      if (guestCart && guestCart.items.length) {
        await prisma.$transaction(async (tx) => {
          for (const item of guestCart.items) {
            const existing = await tx.cartItem.findUnique({
              where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
            });
            if (existing) {
              await tx.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + item.quantity },
              });
            } else {
              await tx.cartItem.create({
                data: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
              });
            }
          }
          await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
          await tx.cart.delete({ where: { id: guestCart.id } });
        });
      }
    }
    return cart;
  }

  if (!guestId) throw badRequest('guestId is required for guest carts');

  let cart = await prisma.cart.findUnique({ where: { guestId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { guestId } });
  }
  return cart;
}

function serializeCart(cart) {
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      ...item.product,
      price: toNumber(item.product.price),
      compareAtPrice:
        item.product.compareAtPrice != null ? toNumber(item.product.compareAtPrice) : null,
    },
    lineTotal: toNumber(item.product.price) * item.quantity,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: cart.id,
    userId: cart.userId,
    guestId: cart.guestId,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
  };
}

export async function getCart({ userId, guestId }) {
  const cart = await resolveCart({ userId, guestId });
  const full = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
    },
  });
  return serializeCart(full);
}

export async function addItem({ userId, guestId, productId, quantity }) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, isActive: true },
  });
  if (!product) throw notFound('Product not found');
  if (product.stockQuantity < quantity) {
    throw badRequest('Insufficient stock');
  }

  const cart = await resolveCart({ userId, guestId });
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const nextQty = (existing?.quantity || 0) + quantity;
  if (product.stockQuantity < nextQty) throw badRequest('Insufficient stock');

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return getCart({ userId, guestId });
}

export async function updateItem({ userId, guestId, itemId, quantity }) {
  const cart = await resolveCart({ userId, guestId });
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: true },
  });
  if (!item) throw notFound('Cart item not found');

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (item.product.stockQuantity < quantity) throw badRequest('Insufficient stock');
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return getCart({ userId, guestId });
}

export async function removeItem({ userId, guestId, itemId }) {
  return updateItem({ userId, guestId, itemId, quantity: 0 });
}

export async function clearCart(cartId, tx = prisma) {
  await tx.cartItem.deleteMany({ where: { cartId } });
}
