import 'dotenv/config';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  await prisma.$connect();

  const app = createApp(config.jwtSecret, config.serviceName);

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'User profile service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap user profile service');
  process.exit(1);
});
