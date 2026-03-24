import { z } from 'zod';

import { AUTH_ROLES } from '../../shared/constants';
import { passwordSchema } from '../../shared/password-policy';

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(10).optional(),
  logoutAll: z.boolean().optional(),
});

export const authorizeRoleSchema = z.enum([AUTH_ROLES.USER, AUTH_ROLES.ADMIN]);
