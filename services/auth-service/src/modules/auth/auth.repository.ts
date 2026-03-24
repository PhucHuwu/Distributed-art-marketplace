import { prisma } from '../../db/prisma';
import type { AuthRole, UserStatus } from '../../shared/constants';
import type { RefreshTokenRecord, UserCredential } from './auth.types';

const mapUser = (user: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): UserCredential => ({
  id: user.id,
  email: user.email,
  passwordHash: user.passwordHash,
  role: user.role as AuthRole,
  status: user.status as UserStatus,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const mapRefreshToken = (token: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}): RefreshTokenRecord => ({
  id: token.id,
  userId: token.userId,
  tokenHash: token.tokenHash,
  expiresAt: token.expiresAt,
  revokedAt: token.revokedAt,
  createdAt: token.createdAt,
});

export const authRepository = {
  async createUser(input: {
    id: string;
    email: string;
    passwordHash: string;
    role: AuthRole;
    status: UserStatus;
  }): Promise<UserCredential> {
    const user = await prisma.userCredential.create({
      data: {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        status: input.status,
      },
    });

    return mapUser(user);
  },

  async findUserByEmail(email: string): Promise<UserCredential | null> {
    const user = await prisma.userCredential.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return mapUser(user);
  },

  async findUserById(id: string): Promise<UserCredential | null> {
    const user = await prisma.userCredential.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return mapUser(user);
  },

  async saveRefreshToken(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    const token = await prisma.refreshToken.create({
      data: {
        id: input.id,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    return mapRefreshToken(token);
  },

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!token) {
      return null;
    }

    return mapRefreshToken(token);
  },

  async revokeRefreshTokenById(id: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async revokeAllRefreshTokensOfUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async rotateRefreshToken(input: {
    oldTokenId: string;
    newTokenId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: {
          id: input.oldTokenId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      await tx.refreshToken.create({
        data: {
          id: input.newTokenId,
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
      });
    });
  },
};
