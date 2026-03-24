import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@local.dev';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';

async function seed(): Promise<void> {
  const email = (process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);

  if (password.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters');
  }

  if (Number.isNaN(rounds) || rounds < 4) {
    throw new Error('BCRYPT_ROUNDS must be a valid number and >= 4');
  }

  const passwordHash = await bcrypt.hash(password, rounds);

  await prisma.credential.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  process.stdout.write(`Seeded local admin account: ${email}\n`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    process.stderr.write(`Auth seed failed: ${String(error)}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
