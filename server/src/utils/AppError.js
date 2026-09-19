export class AppError extends Error {
  constructor(message, statusCode = 500, { code = 'INTERNAL_ERROR', details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export const notFound = (message = 'Resource not found') =>
  new AppError(message, 404, { code: 'NOT_FOUND' });

export const unauthorized = (message = 'Unauthorized') =>
  new AppError(message, 401, { code: 'UNAUTHORIZED' });

export const forbidden = (message = 'Forbidden') =>
  new AppError(message, 403, { code: 'FORBIDDEN' });

export const badRequest = (message = 'Bad request', details = null) =>
  new AppError(message, 400, { code: 'BAD_REQUEST', details });

export const conflict = (message = 'Conflict') =>
  new AppError(message, 409, { code: 'CONFLICT' });
