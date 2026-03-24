import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { TOKEN_TYPES, type AuthRole, type TokenType } from './constants';

export interface JwtClaims {
  sub: string;
  email: string;
  role: AuthRole;
  tokenType: TokenType;
  jti?: string;
}

const buildOptions = (expiresIn: SignOptions['expiresIn']): SignOptions => ({
  expiresIn,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
});

export const signAccessToken = (claims: Omit<JwtClaims, 'tokenType'>): string => {
  return jwt.sign(
    {
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      tokenType: TOKEN_TYPES.ACCESS,
    },
    env.JWT_SECRET,
    buildOptions(env.JWT_EXPIRES_IN as SignOptions['expiresIn']),
  );
};

export const signRefreshToken = (
  claims: Omit<JwtClaims, 'tokenType'> & { jti: string },
): string => {
  const refreshExpiresIn = `${env.REFRESH_TOKEN_EXPIRES_IN_DAYS}d` as SignOptions['expiresIn'];

  return jwt.sign(
    {
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      tokenType: TOKEN_TYPES.REFRESH,
      jti: claims.jti,
    },
    env.JWT_SECRET,
    buildOptions(refreshExpiresIn),
  );
};

export const verifyJwt = (token: string): JwtClaims => {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Token không hợp lệ');
  }

  const claims = decoded as JwtClaims;

  if (!claims.sub || !claims.email || !claims.role || !claims.tokenType) {
    throw new Error('Token thiếu claims bắt buộc');
  }

  return claims;
};
