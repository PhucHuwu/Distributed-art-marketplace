import { describe, expect, it } from 'vitest';

import { TOKEN_TYPES } from '../../src/shared/constants';
import { hashValue, verifyHash } from '../../src/shared/crypto';
import {
  signAccessToken,
  signRefreshToken,
  verifyJwt,
} from '../../src/shared/jwt';

describe('Security utilities', () => {
  it('hashValue/verifyHash hoạt động đúng', async () => {
    const plain = 'Str0ng!Pass123';
    const hash = await hashValue(plain);

    expect(hash).not.toEqual(plain);
    await expect(verifyHash(plain, hash)).resolves.toBe(true);
    await expect(verifyHash('wrong-password', hash)).resolves.toBe(false);
  });

  it('sign/verify access token với claims chuẩn', () => {
    const token = signAccessToken({
      sub: 'user-1',
      email: 'test@example.com',
      role: 'USER',
    });

    const claims = verifyJwt(token);

    expect(claims.sub).toBe('user-1');
    expect(claims.email).toBe('test@example.com');
    expect(claims.role).toBe('USER');
    expect(claims.tokenType).toBe(TOKEN_TYPES.ACCESS);
  });

  it('sign/verify refresh token chứa jti', () => {
    const token = signRefreshToken({
      sub: 'user-2',
      email: 'refresh@example.com',
      role: 'USER',
      jti: 'refresh-123',
    });

    const claims = verifyJwt(token);

    expect(claims.tokenType).toBe(TOKEN_TYPES.REFRESH);
    expect(claims.jti).toBe('refresh-123');
  });
});
