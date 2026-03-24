import { randomUUID } from 'crypto';

import { createEventEnvelope } from '../../events/event.factory';
import { eventPublisher } from '../../events/event.publisher';
import { env } from '../../config/env';
import type {
  UserLoginSucceededPayload,
  UserRegisteredPayload,
} from '../../events/event.types';
import {
  AUTH_ROLES,
  TOKEN_TYPES,
  USER_STATUS,
  type AuthRole,
} from '../../shared/constants';
import { hashToken, hashValue, verifyHash } from '../../shared/crypto';
import { HttpError } from '../../shared/http-error';
import {
  signAccessToken,
  signRefreshToken,
  verifyJwt,
  type JwtClaims,
} from '../../shared/jwt';
import { authRepository } from './auth.repository';

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RefreshInput {
  refreshToken: string;
}

interface LogoutInput {
  refreshToken?: string;
  userId: string;
  logoutAll?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const buildRefreshExpiry = (): Date => {
  const now = Date.now();
  const expireMs = env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
  return new Date(now + expireMs);
};

const issueTokens = async (params: {
  userId: string;
  email: string;
  role: AuthRole;
}): Promise<AuthTokens> => {
  const refreshId = randomUUID();
  const accessToken = signAccessToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
  });
  const refreshToken = signRefreshToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
    jti: refreshId,
  });

  await authRepository.saveRefreshToken({
    id: refreshId,
    userId: params.userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: buildRefreshExpiry(),
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const authService = {
  async register(input: RegisterInput): Promise<{ userId: string; email: string; role: AuthRole }> {
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng');
    }

    const userId = randomUUID();
    const passwordHash = await hashValue(input.password);

    try {
      const createdUser = await authRepository.createUser({
        id: userId,
        email: input.email,
        passwordHash,
        role: AUTH_ROLES.USER,
        status: USER_STATUS.ACTIVE,
      });

      const event = createEventEnvelope<UserRegisteredPayload>('user.registered', {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      });

      await eventPublisher.publish('user.registered', event);

      return {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      };
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email đã được sử dụng');
      }

      throw error;
    }
  },

  async login(input: LoginInput): Promise<{
    userId: string;
    email: string;
    role: AuthRole;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new HttpError(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa');
    }

    const isValidPassword = await verifyHash(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    }

    const tokens = await issueTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const event = createEventEnvelope<UserLoginSucceededPayload>('user.login_succeeded', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await eventPublisher.publish('user.login_succeeded', event);

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async refresh(input: RefreshInput): Promise<AuthTokens> {
    let claims: JwtClaims;
    try {
      claims = verifyJwt(input.refreshToken);
    } catch {
      throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (claims.tokenType !== TOKEN_TYPES.REFRESH || !claims.jti) {
      throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ');
    }

    const storedToken = await authRepository.findRefreshTokenByHash(hashToken(input.refreshToken));
    if (!storedToken) {
      throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không tồn tại');
    }

    if (storedToken.revokedAt) {
      throw new HttpError(401, 'TOKEN_REVOKED', 'Refresh token đã bị thu hồi');
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      throw new HttpError(401, 'TOKEN_EXPIRED', 'Refresh token đã hết hạn');
    }

    const user = await authRepository.findUserById(storedToken.userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Tài khoản không hợp lệ');
    }

    const newRefreshId = randomUUID();
    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: newRefreshId,
    });

    await authRepository.rotateRefreshToken({
      oldTokenId: storedToken.id,
      newTokenId: newRefreshId,
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: buildRefreshExpiry(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(input: LogoutInput): Promise<void> {
    if (input.logoutAll) {
      await authRepository.revokeAllRefreshTokensOfUser(input.userId);
      return;
    }

    if (!input.refreshToken) {
      throw new HttpError(400, 'MISSING_REFRESH_TOKEN', 'Thiếu refresh token để logout');
    }

    const storedToken = await authRepository.findRefreshTokenByHash(hashToken(input.refreshToken));
    if (!storedToken || storedToken.userId !== input.userId) {
      throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ');
    }

    await authRepository.revokeRefreshTokenById(storedToken.id);
  },

  async getMe(userId: string): Promise<{ userId: string; email: string; role: AuthRole }> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  },
};
