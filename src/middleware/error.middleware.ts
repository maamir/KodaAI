import { Request, Response, NextFunction } from 'express';
import { AppError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';
import { config } from '../config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    requestId: (req as any).id,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Unexpected error
  const statusCode = 500;
  const message = config.isProduction()
    ? 'An unexpected error occurred'
    : err.message;

  res.status(statusCode).json({
    code: 'INTERNAL_ERROR',
    message,
    details: config.isProduction() ? undefined : err.stack,
  });
}
