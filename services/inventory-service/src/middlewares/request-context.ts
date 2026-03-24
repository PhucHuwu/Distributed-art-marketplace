import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    correlationId: String(req.headers['x-correlation-id'] || ''),
  }),
});

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-correlation-id'];
  const correlationId = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : randomUUID();

  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  httpLogger(req, res);
  next();
}
