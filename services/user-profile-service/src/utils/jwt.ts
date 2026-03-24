import jwt from 'jsonwebtoken';
import { UserIdentity } from '../types/request';

export function verifyIdentityToken(token: string, secret: string): UserIdentity {
  return jwt.verify(token, secret) as UserIdentity;
}
