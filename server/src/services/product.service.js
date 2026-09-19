import { prisma } from '../config/prisma.js';
import { notFound, conflict } from '../utils/AppError.js';
import { slugify, toNumber } from '../utils/helpers.js';

function buildOrderBy(sort) {
  switch (sort) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'oldest':
      return { createdAt: 'asc' };
    case 'name_asc':
      return { name: 'asc' };
    case 'popularity':
      return { reviews: { _count: 'desc' } };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export async function listProducts(query) {
  const { page, limit, category, categoryId, minPrice, maxPrice, search, sort, isActive } = query;
  const where = {
    deletedAt: null,
    ...(isActive === undefined ? { isActive: true } : { isActive }),
  };

  if (categoryId) where.categoryId = categoryId;
  if (category) where.category = { slug: category };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true }, where: { isApproved: true } },
      },
    }),
  ]);

  const data = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
    const { reviews, ...rest } = p;
    return {
      ...rest,
      price: toNumber(rest.price),
      compareAtPrice: rest.compareAtPrice != null ? toNumber(rest.compareAtPrice) : null,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: p._count.reviews,
    };
  });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getProductBySlug(slug) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: {
      category: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) throw notFound('Product not found');

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      deletedAt: null,
      isActive: true,
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  const ratings = product.reviews.map((r) => r.rating);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return {
    ...product,
    price: toNumber(product.price),
    compareAtPrice: product.compareAtPrice != null ? toNumber(product.compareAtPrice) : null,
    avgRating,
    reviewCount: ratings.length,
    related: related.map((r) => ({
      ...r,
      price: toNumber(r.price),
      compareAtPrice: r.compareAtPrice != null ? toNumber(r.compareAtPrice) : null,
    })),
  };
}

export async function createProduct(data, imagePaths = []) {
  const slug = data.slug || slugify(data.name);
  const [slugExists, skuExists] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.product.findUnique({ where: { sku: data.sku } }),
  ]);
  if (slugExists) throw conflict('Product slug already exists');
  if (skuExists) throw conflict('SKU already exists');

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw notFound('Category not found');

  const images = [...(data.images || []), ...imagePaths];

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      stockQuantity: data.stockQuantity ?? 0,
      sku: data.sku,
      categoryId: data.categoryId,
      isActive: data.isActive ?? true,
      images,
    },
    include: { category: true },
  });

  return {
    ...product,
    price: toNumber(product.price),
    compareAtPrice: product.compareAtPrice != null ? toNumber(product.compareAtPrice) : null,
  };
}

export async function updateProduct(id, data, imagePaths = []) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('Product not found');

  const slug = data.slug || (data.name ? slugify(data.name) : undefined);
  if (slug && slug !== existing.slug) {
    const clash = await prisma.product.findUnique({ where: { slug } });
    if (clash) throw conflict('Product slug already exists');
  }
  if (data.sku && data.sku !== existing.sku) {
    const clash = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (clash) throw conflict('SKU already exists');
  }

  const images =
    imagePaths.length > 0
      ? [...(data.images || existing.images), ...imagePaths]
      : data.images !== undefined
        ? data.images
        : undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slug && { slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
      ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(images !== undefined && { images }),
    },
    include: { category: true },
  });

  return {
    ...product,
    price: toNumber(product.price),
    compareAtPrice: product.compareAtPrice != null ? toNumber(product.compareAtPrice) : null,
  };
}

/** Soft delete */
export async function deleteProduct(id) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('Product not found');

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { id };
}
