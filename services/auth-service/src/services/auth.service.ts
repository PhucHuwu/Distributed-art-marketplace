import { prisma } from '../lib/prisma';

export async function findCredentialByEmail(email: string) {
  return prisma.credential.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function createCredential(input: {
  email: string;
  passwordHash: string;
}) {
  return prisma.credential.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
    },
  });
}

export async function ensureAdminCredential(input: {
  email: string;
  passwordHash: string;
}) {
  return prisma.credential.upsert({
    where: { email: input.email.toLowerCase() },
    update: {
      role: 'ADMIN',
      passwordHash: input.passwordHash,
    },
    create: {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: 'ADMIN',
    },
  });
}
