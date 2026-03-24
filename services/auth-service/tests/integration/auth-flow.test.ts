import { afterEach, describe, expect, it, vi } from 'vitest';

import { authRepository } from '../../src/modules/auth/auth.repository';
import { authService } from '../../src/modules/auth/auth.service';
import { USER_STATUS } from '../../src/shared/constants';
import { hashToken, hashValue } from '../../src/shared/crypto';
import { signRefreshToken } from '../../src/shared/jwt';
import { eventPublisher } from '../../src/events/event.publisher';

describe('Auth service flows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('register thành công và publish user.registered', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'createUser').mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      passwordHash: 'hashed',
      role: 'USER',
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const publishSpy = vi.spyOn(eventPublisher, 'publish').mockResolvedValue();

    const output = await authService.register({
      email: 'new@example.com',
      password: 'Str0ng!Pass123',
    });

    expect(output.email).toBe('new@example.com');
    expect(output.role).toBe('USER');
    expect(publishSpy).toHaveBeenCalledWith(
      'user.registered',
      expect.objectContaining({ eventType: 'user.registered' }),
    );
  });

  it('login thất bại khi sai mật khẩu', async () => {
    const passwordHash = await hashValue('Correct!Pass123');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'u2',
      email: 'login@example.com',
      passwordHash,
      role: 'USER',
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({
        email: 'login@example.com',
        password: 'Wrong!Pass123',
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('refresh thành công và rotation refresh token', async () => {
    const oldRefreshToken = signRefreshToken({
      sub: 'u3',
      email: 'refresh@example.com',
      role: 'USER',
      jti: 'old-jti',
    });

    vi.spyOn(authRepository, 'findRefreshTokenByHash').mockResolvedValue({
      id: 'old-jti',
      userId: 'u3',
      tokenHash: hashToken(oldRefreshToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue({
      id: 'u3',
      email: 'refresh@example.com',
      passwordHash: 'x',
      role: 'USER',
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const rotateSpy = vi.spyOn(authRepository, 'rotateRefreshToken').mockResolvedValue();

    const tokens = await authService.refresh({ refreshToken: oldRefreshToken });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(rotateSpy).toHaveBeenCalledTimes(1);
  });

  it('refresh thất bại khi token đã revoke', async () => {
    const revokedToken = signRefreshToken({
      sub: 'u4',
      email: 'revoked@example.com',
      role: 'USER',
      jti: 'revoked-jti',
    });

    vi.spyOn(authRepository, 'findRefreshTokenByHash').mockResolvedValue({
      id: 'revoked-jti',
      userId: 'u4',
      tokenHash: hashToken(revokedToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      createdAt: new Date(),
    });

    await expect(authService.refresh({ refreshToken: revokedToken })).rejects.toMatchObject({
      statusCode: 401,
      code: 'TOKEN_REVOKED',
    });
  });

  it('race condition register cùng email: chỉ một request thành công', async () => {
    let createCallCount = 0;

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'createUser').mockImplementation(async () => {
      createCallCount += 1;
      if (createCallCount === 1) {
        return {
          id: 'u5',
          email: 'race@example.com',
          passwordHash: 'hashed',
          role: 'USER',
          status: USER_STATUS.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const error = new Error('duplicate');
      (error as Error & { code?: string }).code = '23505';
      throw error;
    });
    vi.spyOn(eventPublisher, 'publish').mockResolvedValue();

    const results = await Promise.allSettled([
      authService.register({ email: 'race@example.com', password: 'Str0ng!Pass123' }),
      authService.register({ email: 'race@example.com', password: 'Str0ng!Pass123' }),
    ]);

    const fulfilledCount = results.filter((result) => result.status === 'fulfilled').length;
    const rejected = results.find((result) => result.status === 'rejected');

    expect(fulfilledCount).toBe(1);
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toMatchObject({
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }
  });

  it('logout revoke refresh token thành công', async () => {
    const refreshToken = signRefreshToken({
      sub: 'u6',
      email: 'logout@example.com',
      role: 'USER',
      jti: 'logout-jti',
    });

    vi.spyOn(authRepository, 'findRefreshTokenByHash').mockResolvedValue({
      id: 'logout-jti',
      userId: 'u6',
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    const revokeSpy = vi.spyOn(authRepository, 'revokeRefreshTokenById').mockResolvedValue();

    await authService.logout({
      userId: 'u6',
      refreshToken,
    });

    expect(revokeSpy).toHaveBeenCalledWith('logout-jti');
  });
});
