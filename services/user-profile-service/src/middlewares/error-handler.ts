import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(
    {
      err: error,
      correlationId: req.headers['x-correlation-id'] || null,
    },
    'Unhandled request error',
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    },
    correlationId: req.headers['x-correlation-id'] || null,
  });
}
