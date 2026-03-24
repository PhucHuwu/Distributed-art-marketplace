import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    correlationId: req.headers['x-correlation-id'] || null,
  }),
});

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  httpLogger(req, res);
  next();
}
