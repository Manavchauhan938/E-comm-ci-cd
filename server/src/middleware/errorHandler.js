import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError('Route not found', 404, { code: 'NOT_FOUND' }));
}

export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'CONFLICT';
      message = 'A record with this value already exists';
      details = { fields: err.meta?.target };
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    }
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  } else if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    details = err.details;
  }

  if (status >= 500) {
    logger.error({ err, code }, message);
  } else {
    logger.warn({ code, details, status }, message);
  }

  const body = {
    success: false,
    data: null,
    message: env.isProd && status >= 500 ? 'Internal server error' : message,
    error: env.isProd && status >= 500 ? 'Internal server error' : message,
    code,
  };

  if (details && status < 500) {
    body.details = details;
  }

  return res.status(status).json(body);
}
