import type { AuthRole, UserStatus } from '../../shared/constants';

export interface UserCredential {
  id: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}
