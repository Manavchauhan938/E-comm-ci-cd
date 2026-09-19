import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecomm.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ecomm.local',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const customerHash = await bcrypt.hash('Customer123!', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@ecomm.local' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@ecomm.local',
      passwordHash: customerHash,
      role: 'CUSTOMER',
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets and devices',
      sortOrder: 1,
    },
  });

  const apparel = await prisma.category.upsert({
    where: { slug: 'apparel' },
    update: {},
    create: {
      name: 'Apparel',
      slug: 'apparel',
      description: 'Clothing and accessories',
      sortOrder: 2,
    },
  });

  const products = [
    {
      name: 'Aurora Wireless Headphones',
      slug: 'aurora-wireless-headphones',
      description:
        'Premium over-ear headphones with active noise cancellation, 30-hour battery, and studio-tuned drivers.',
      price: 199.99,
      compareAtPrice: 249.99,
      stockQuantity: 48,
      sku: 'AUD-AURORA-01',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      ],
    },
    {
      name: 'Nimbus Smart Watch',
      slug: 'nimbus-smart-watch',
      description:
        'Lightweight aluminum smartwatch with health tracking, GPS, and always-on display.',
      price: 299.0,
      compareAtPrice: 349.0,
      stockQuantity: 32,
      sku: 'WCH-NIMBUS-01',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      ],
    },
    {
      name: 'Meridian Linen Shirt',
      slug: 'meridian-linen-shirt',
      description: 'Breathable linen shirt with a relaxed fit. Perfect for warm weather layers.',
      price: 68.0,
      compareAtPrice: 88.0,
      stockQuantity: 120,
      sku: 'APP-MERIDIAN-01',
      categoryId: apparel.id,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
      ],
    },
    {
      name: 'Orbit Desk Lamp',
      slug: 'orbit-desk-lamp',
      description: 'Minimal LED desk lamp with warm/cool modes and USB-C charging port.',
      price: 79.5,
      compareAtPrice: null,
      stockQuantity: 64,
      sku: 'HOM-ORBIT-01',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      ],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off first order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
  });

  console.log('Seed complete:', { admin: admin.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
