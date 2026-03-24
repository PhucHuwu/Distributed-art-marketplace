import type { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export const sendError = (res: Response, status: number, body: ErrorBody): void => {
  res.status(status).json(body);
};
