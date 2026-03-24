import jwt from 'jsonwebtoken';
import { AuthContext } from '../types/request';

export function signAuthToken(payload: AuthContext, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAuthToken(token: string, secret: string): AuthContext {
  return jwt.verify(token, secret) as AuthContext;
}
