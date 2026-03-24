import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { ensureAdminCredential } from './services/auth.service';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  await prisma.$connect();

  if (config.autoSeedAdmin && process.env.NODE_ENV !== 'production') {
    const passwordHash = await bcrypt.hash(config.adminSeedPassword, config.bcryptRounds);
    const admin = await ensureAdminCredential({
      email: config.adminSeedEmail,
      passwordHash,
    });

    logger.info({ email: admin.email }, 'Local admin credential ensured');
  }

  const app = createApp({
    jwtSecret: config.jwtSecret,
    serviceName: config.serviceName,
    jwtExpiresIn: config.jwtExpiresIn,
    bcryptRounds: config.bcryptRounds,
  });

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Auth service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap auth service');
  process.exit(1);
});
