import { execSync } from 'child_process';

import { logger } from '../shared/logger';

const run = async (): Promise<void> => {
  execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
    stdio: 'inherit',
  });

  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
  });
};

run().catch((error) => {
  logger.error('Failed to run Prisma migration', { error });
  process.exit(1);
});
