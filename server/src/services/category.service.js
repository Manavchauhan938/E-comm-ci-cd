import { prisma } from '../config/prisma.js';
import { notFound, conflict, badRequest } from '../utils/AppError.js';
import { slugify } from '../utils/helpers.js';

export async function listCategories({ includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
  if (!category) throw notFound('Category not found');
  return category;
}

export async function createCategory(data) {
  const slug = data.slug || slugify(data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw conflict('Category slug already exists');

  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw badRequest('Parent category not found');
  }

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      parentId: data.parentId ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateCategory(id, data) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw notFound('Category not found');

  const slug = data.slug || (data.name ? slugify(data.name) : undefined);
  if (slug && slug !== category.slug) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw conflict('Category slug already exists');
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(slug && { slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
}

export async function deleteCategory(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) throw notFound('Category not found');
  if (category._count.products > 0) {
    throw badRequest('Cannot delete category with products — reassign or deactivate instead');
  }
  if (category._count.children > 0) {
    throw badRequest('Cannot delete category with subcategories');
  }
  await prisma.category.delete({ where: { id } });
  return { id };
}
