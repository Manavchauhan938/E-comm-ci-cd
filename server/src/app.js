import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import * as paymentController from './controllers/payment.controller.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes, { adminOrderRouter } from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import addressRoutes from './routes/address.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              connectSrc: ["'self'", env.clientUrl],
            },
          }
        : false,
    })
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        // Same-origin / Netlify Functions / local tools
        if (!origin || origin === env.clientUrl || origin.endsWith('.netlify.app')) {
          return cb(null, true);
        }
        return cb(null, env.clientUrl);
      },
      credentials: true,
    })
  );

  app.use(compression());
  app.use(globalLimiter);
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    })
  );

  // Stripe webhook needs raw body — mount BEFORE json parser
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.webhook
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), env.uploadDir), {
      maxAge: env.isProd ? '7d' : 0,
    })
  );

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin/orders', adminOrderRouter);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/addresses', addressRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
