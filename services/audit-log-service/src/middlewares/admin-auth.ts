import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

type AdminJwtPayload = JwtPayload & {
  role?: string;
  userId?: string;
};

export function adminAuth(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
          details: [],
        },
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    try {
      const decoded = jwt.verify(token, jwtSecret) as AdminJwtPayload;
      if (decoded.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin role is required',
            details: [],
          },
        });
        return;
      }

      next();
    } catch (_error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
          details: [],
        },
      });
    }
  };
}
