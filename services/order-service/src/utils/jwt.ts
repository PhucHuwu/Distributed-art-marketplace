import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthContext } from '../types/request';

export function verifyAuthToken(token: string, jwtSecret: string): AuthContext {
  return jwt.verify(token, jwtSecret) as AuthContext;
}

export function signAuthToken(payload: AuthContext, jwtSecret: string, expiresIn: string): string {
  return jwt.sign(payload, jwtSecret, { expiresIn } as SignOptions);
}
