import type { NextFunction, Request, Response } from 'express';

import { logger } from './logger';

export const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const endAt = process.hrtime.bigint();
    const durationMs = Number(endAt - startAt) / 1_000_000;

    logger.info('HTTP request completed', {
      requestId: req.context?.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.user?.userId,
    });
  });

  next();
};
