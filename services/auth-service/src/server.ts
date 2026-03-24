import 'dotenv/config';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  await prisma.$connect();

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
