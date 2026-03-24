import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { sendError } from './api-response';
import { HttpError } from './http-error';
import { logger } from './logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, {
    code: 'NOT_FOUND',
    message: `Không tìm thấy endpoint ${req.method} ${req.path}`,
  });
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    sendError(res, error.statusCode, {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu đầu vào không hợp lệ',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  logger.error('Unhandled error', {
    requestId: req.context?.requestId,
    path: req.path,
    method: req.method,
    error,
  });

  sendError(res, 500, {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Hệ thống gặp lỗi không xác định',
  });
};
