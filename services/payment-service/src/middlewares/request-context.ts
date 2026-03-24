import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    correlationId: req.headers['x-correlation-id'] || null,
  }),
});

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string | undefined)?.trim() || randomUUID();

  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  httpLogger(req, res);
  next();
}
