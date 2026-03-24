import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { env } from '../config/env';

export const hashValue = async (value: string): Promise<string> => {
  return bcrypt.hash(value, env.BCRYPT_ROUNDS);
};

export const verifyHash = async (value: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(value, hash);
};

export const hashToken = (value: string): string => {
  return createHash('sha256').update(value).digest('hex');
};
