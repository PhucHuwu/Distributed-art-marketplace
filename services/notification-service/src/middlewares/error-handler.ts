import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

type HttpLikeError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown[];
};

export function errorHandler(error: HttpLikeError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  logger.error(
    {
      err: error,
      correlationId: req.headers['x-correlation-id'] || null,
    },
    'Unhandled request error',
  );

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error.message || 'Internal server error',
      details: Array.isArray(error.details) ? error.details : [],
    },
    correlationId: req.headers['x-correlation-id'] || null,
  });
}
