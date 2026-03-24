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
