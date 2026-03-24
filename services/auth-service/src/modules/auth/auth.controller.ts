import type { Request, Response } from 'express';

import { HttpError } from '../../shared/http-error';
import { authService } from './auth.service';
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from './auth.schema';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const body = registerBodySchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response): Promise<void> {
    const body = loginBodySchema.parse(req.body);
    const result = await authService.login(body);
    res.status(200).json(result);
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const body = refreshBodySchema.parse(req.body);
    const result = await authService.refresh(body);
    res.status(200).json(result);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const body = logoutBodySchema.parse(req.body);

    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Bạn chưa đăng nhập');
    }

    await authService.logout({
      userId: currentUserId,
      refreshToken: body.refreshToken,
      logoutAll: body.logoutAll,
    });

    res.status(204).send();
  },

  async me(req: Request, res: Response): Promise<void> {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Bạn chưa đăng nhập');
    }

    const result = await authService.getMe(currentUserId);
    res.status(200).json(result);
  },
};
