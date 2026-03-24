import type { NextFunction, Request, Response } from 'express';

import { AUTH_ROLES } from '../../shared/constants';
import { HttpError } from '../../shared/http-error';
import { verifyJwt } from '../../shared/jwt';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJwt = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.header('authorization');
  if (!authHeader) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Thiếu Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Authorization header không hợp lệ');
  }

  try {
    const claims = verifyJwt(token);

    if (claims.tokenType !== 'access') {
      throw new HttpError(401, 'UNAUTHORIZED', 'Chỉ chấp nhận access token');
    }

    req.user = {
      userId: claims.sub,
      email: claims.email,
      role: claims.role,
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'UNAUTHORIZED', 'Token không hợp lệ hoặc đã hết hạn');
  }
};

export const authorizeRole = (...roles: string[]) => {
  const allowedRoles = roles.length > 0 ? roles : [AUTH_ROLES.USER, AUTH_ROLES.ADMIN];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Bạn chưa đăng nhập');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập tài nguyên này');
    }

    next();
  };
};
