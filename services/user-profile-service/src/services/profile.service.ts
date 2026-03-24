import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function getOrCreateProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.userProfile.create({
    data: { userId },
  });
}

export async function updateProfile(
  userId: string,
  data: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  },
) {
  const profile = await getOrCreateProfile(userId);

  return prisma.userProfile.update({
    where: { id: profile.id },
    data,
  });
}

export async function listAddresses(userId: string) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

type AddressInput = {
  recipient: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  ward: string;
  district: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
};

export async function createAddress(userId: string, input: AddressInput) {
  const profile = await getOrCreateProfile(userId);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (input.isDefault) {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await tx.userAddress.create({
      data: {
        userId,
        profileId: profile.id,
        recipient: input.recipient,
        phoneNumber: input.phoneNumber,
        line1: input.line1,
        line2: input.line2,
        ward: input.ward,
        district: input.district,
        city: input.city,
        postalCode: input.postalCode,
        isDefault: Boolean(input.isDefault),
      },
    });

    if (!input.isDefault) {
      const count = await tx.userAddress.count({ where: { userId } });
      if (count === 1) {
        return tx.userAddress.update({
          where: { id: created.id },
          data: { isDefault: true },
        });
      }
    }

    return created;
  });
}

export async function updateAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!existing) {
    return null;
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (input.isDefault) {
      await tx.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.userAddress.update({
      where: { id: addressId },
      data: {
        recipient: input.recipient,
        phoneNumber: input.phoneNumber,
        line1: input.line1,
        line2: input.line2,
        ward: input.ward,
        district: input.district,
        city: input.city,
        postalCode: input.postalCode,
        isDefault: input.isDefault,
      },
    });
  });
}

export async function deleteAddress(userId: string, addressId: string): Promise<boolean> {
  const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!existing) {
    return false;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userAddress.delete({ where: { id: addressId } });

    if (!existing.isDefault) {
      return;
    }

    const fallback = await tx.userAddress.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (fallback) {
      await tx.userAddress.update({
        where: { id: fallback.id },
        data: { isDefault: true },
      });
    }
  });

  return true;
}
