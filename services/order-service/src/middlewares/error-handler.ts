import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { HttpError } from '../utils/http-error';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = req.headers['x-correlation-id'] || null;

  logger.error(
    {
      err: error,
      correlationId,
    },
    'Unhandled request error',
  );

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      correlationId,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    },
    correlationId,
  });
}
