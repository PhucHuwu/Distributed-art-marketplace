import 'dotenv/config';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  const app = createApp(config.jwtSecret, config.serviceName);

  await prisma.$connect();

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Catalog service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap catalog service');
  process.exit(1);
});
