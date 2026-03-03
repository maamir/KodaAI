import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../infrastructure/logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  (req as any).id = requestId;
  (req as any).logger = logger.child({
    requestId,
    method: req.method,
    path: req.path,
  });

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}
