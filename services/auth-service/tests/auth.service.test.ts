import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCredential,
  ensureAdminCredential,
  findCredentialByEmail,
} from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';

test('findCredentialByEmail normalizes email to lowercase', async () => {
  const credentialDelegate = prisma.credential as unknown as {
    findUnique: (args: unknown) => Promise<unknown>;
  };

  const originalFindUnique = credentialDelegate.findUnique;
  let capturedArgs: any;

  credentialDelegate.findUnique = async (args: unknown) => {
    capturedArgs = args;
    return null;
  };

  try {
    await findCredentialByEmail('TeSt@Example.COM');
    assert.deepEqual(capturedArgs, {
      where: { email: 'test@example.com' },
    });
  } finally {
    credentialDelegate.findUnique = originalFindUnique;
  }
});

test('createCredential stores normalized email and password hash', async () => {
  const credentialDelegate = prisma.credential as unknown as {
    create: (args: unknown) => Promise<unknown>;
  };

  const originalCreate = credentialDelegate.create;
  let capturedArgs: any;

  credentialDelegate.create = async (args: unknown) => {
    capturedArgs = args;
    return { id: 'cred-1' };
  };

  try {
    await createCredential({
      email: 'Artist@Example.COM',
      passwordHash: 'hashed-value',
    });

    assert.deepEqual(capturedArgs, {
      data: {
        email: 'artist@example.com',
        passwordHash: 'hashed-value',
      },
    });
  } finally {
    credentialDelegate.create = originalCreate;
  }
});

test('ensureAdminCredential upserts with ADMIN role and lowercase email', async () => {
  const credentialDelegate = prisma.credential as unknown as {
    upsert: (args: unknown) => Promise<unknown>;
  };

  const originalUpsert = credentialDelegate.upsert;
  let capturedArgs: any;

  credentialDelegate.upsert = async (args: unknown) => {
    capturedArgs = args;
    return { id: 'cred-admin-1' };
  };

  try {
    await ensureAdminCredential({
      email: 'Admin@Example.COM',
      passwordHash: 'new-admin-hash',
    });

    assert.deepEqual(capturedArgs, {
      where: { email: 'admin@example.com' },
      update: {
        role: 'ADMIN',
        passwordHash: 'new-admin-hash',
      },
      create: {
        email: 'admin@example.com',
        passwordHash: 'new-admin-hash',
        role: 'ADMIN',
      },
    });
  } finally {
    credentialDelegate.upsert = originalUpsert;
  }
});
