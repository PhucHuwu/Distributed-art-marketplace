import jwt from 'jsonwebtoken';
import { AuthContext } from '../types/request';

export function verifyAuthToken(token: string, jwtSecret: string): AuthContext {
  const decoded = jwt.verify(token, jwtSecret);

  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }

  const claims = decoded as Partial<AuthContext>;

  if (!claims.userId || !claims.email || !claims.role) {
    throw new Error('Missing required token claims');
  }

  return {
    userId: String(claims.userId),
    email: String(claims.email),
    role: String(claims.role),
  };
}
