import { randomUUID } from 'crypto';

import { prisma } from '../src/db/prisma';
import { hashValue } from '../src/shared/crypto';

const run = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const adminEmail = process.env.DEV_ADMIN_EMAIL;
  const adminPassword = process.env.DEV_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const passwordHash = await hashValue(adminPassword);

  await prisma.userCredential.upsert({
    where: { email: adminEmail },
    create: {
      id: randomUUID(),
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
