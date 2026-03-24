import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createCredential, findCredentialByEmail } from '../services/auth.service';
import { comparePassword, hashPassword } from '../utils/hash';
import { signAuthToken } from '../utils/jwt';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function createAuthRouter(config: {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  deps?: {
    createCredential?: typeof createCredential;
    findCredentialByEmail?: typeof findCredentialByEmail;
    hashPassword?: typeof hashPassword;
    comparePassword?: typeof comparePassword;
    signAuthToken?: typeof signAuthToken;
  };
}): Router {
  const router = Router();
  const deps = {
    createCredential: config.deps?.createCredential || createCredential,
    findCredentialByEmail: config.deps?.findCredentialByEmail || findCredentialByEmail,
    hashPassword: config.deps?.hashPassword || hashPassword,
    comparePassword: config.deps?.comparePassword || comparePassword,
    signAuthToken: config.deps?.signAuthToken || signAuthToken,
  };

  router.post('/auth/register', async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password || !isValidEmail(email) || password.length < 8) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email or password',
            details: [],
          },
        });
        return;
      }

      const passwordHash = await deps.hashPassword(password, config.bcryptRounds);
      const credential = await deps.createCredential({
        email,
        passwordHash,
      });

      const token = deps.signAuthToken(
        {
          userId: credential.userId,
          email: credential.email,
          role: credential.role,
        },
        config.jwtSecret,
        config.jwtExpiresIn,
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          tokenType: 'Bearer',
        },
      });
    } catch (error) {
      const known = error as { code?: string };
      if (known.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already exists',
            details: [],
          },
        });
        return;
      }

      next(error);
    }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password || !isValidEmail(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email or password',
            details: [],
          },
        });
        return;
      }

      const credential = await deps.findCredentialByEmail(email);
      if (!credential) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
            details: [],
          },
        });
        return;
      }

      const matched = await deps.comparePassword(password, credential.passwordHash);
      if (!matched) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
            details: [],
          },
        });
        return;
      }

      const token = deps.signAuthToken(
        {
          userId: credential.userId,
          email: credential.email,
          role: credential.role,
        },
        config.jwtSecret,
        config.jwtExpiresIn,
      );

      res.status(200).json({
        success: true,
        data: {
          token,
          tokenType: 'Bearer',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/auth/verify', auth(config.jwtSecret), (req, res) => {
    res.status(200).json({
      success: true,
      data: req.auth,
    });
  });

  router.post('/auth/refresh', (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Refresh token flow skeleton is not implemented yet',
        details: [],
      },
    });
  });

  return router;
}
