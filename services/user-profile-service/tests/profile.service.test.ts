import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/lib/prisma';
import { createAddress, updateAddress } from '../src/services/profile.service';

test('createAddress clears previous defaults when new address is default', async () => {
  const profileDelegate = prisma.userProfile as unknown as {
    findUnique: (args: unknown) => Promise<unknown>;
  };
  const originalFindUnique = profileDelegate.findUnique;

  const originalTransaction = prisma.$transaction;
  const calls: string[] = [];

  profileDelegate.findUnique = async () => ({ id: 'profile-1', userId: 'user-1' });

  (prisma as unknown as { $transaction: (fn: (tx: any) => Promise<unknown>) => Promise<unknown> }).$transaction =
    async (fn: (tx: any) => Promise<unknown>) => {
      const tx = {
        userAddress: {
          updateMany: async () => {
            calls.push('updateMany');
          },
          create: async () => {
            calls.push('create');
            return { id: 'address-1', isDefault: true };
          },
          count: async () => {
            calls.push('count');
            return 2;
          },
          update: async () => {
            calls.push('update');
            return { id: 'address-1', isDefault: true };
          },
        },
      };

      return fn(tx);
    };

  try {
    const created = await createAddress('user-1', {
      recipient: 'A',
      phoneNumber: '0900000000',
      line1: '123',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'HCM',
      isDefault: true,
    });

    assert.equal((created as { id: string }).id, 'address-1');
    assert.deepEqual(calls, ['updateMany', 'create']);
  } finally {
    profileDelegate.findUnique = originalFindUnique;
    (prisma as unknown as { $transaction: typeof prisma.$transaction }).$transaction = originalTransaction;
  }
});

test('updateAddress returns null when address does not belong to user', async () => {
  const addressDelegate = prisma.userAddress as unknown as {
    findFirst: (args: unknown) => Promise<unknown>;
  };
  const originalFindFirst = addressDelegate.findFirst;

  addressDelegate.findFirst = async () => null;

  try {
    const result = await updateAddress('user-1', 'missing-address', { city: 'Da Nang' });
    assert.equal(result, null);
  } finally {
    addressDelegate.findFirst = originalFindFirst;
  }
});
