import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export interface RequestContext {
  requestId: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = req.header('x-request-id') ?? randomUUID();
  req.context = { requestId };
  res.setHeader('x-request-id', requestId);
  next();
};
