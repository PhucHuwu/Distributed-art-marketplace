import { Router } from 'express';

import { asyncHandler } from '../../shared/async-handler';
import { AUTH_ROLES } from '../../shared/constants';
import { authController } from './auth.controller';
import { authenticateJwt, authorizeRole } from './auth.middleware';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', authenticateJwt, asyncHandler(authController.logout));
authRouter.get('/me', authenticateJwt, asyncHandler(authController.me));

authRouter.get(
  '/admin/health',
  authenticateJwt,
  authorizeRole(AUTH_ROLES.ADMIN),
  asyncHandler(async (_req, res) => {
    res.status(200).json({ ok: true });
  }),
);
