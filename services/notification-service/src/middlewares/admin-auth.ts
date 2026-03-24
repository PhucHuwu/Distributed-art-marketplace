import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/jwt';

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

    try {
      const token = authHeader.slice('Bearer '.length).trim();
      const authContext = verifyAuthToken(token, jwtSecret);

      if (authContext.role !== 'ADMIN') {
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

      req.auth = authContext;
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
