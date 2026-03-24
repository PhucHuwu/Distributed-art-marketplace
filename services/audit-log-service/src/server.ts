import 'dotenv/config';
import { startConsumer } from './broker/consumer';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  const app = createApp(config.jwtSecret, config.serviceName);

  await prisma.$connect();

  await startConsumer({
    rabbitmqUrl: config.rabbitmqUrl,
    exchange: config.rabbitmqExchange,
    queue: config.rabbitmqQueue,
    routingKeys: config.rabbitmqRoutingKeys,
    maxRetryCount: config.maxRetryCount,
    retryDelayMs: config.retryDelayMs,
  });

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Audit log service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap audit log service');
  process.exit(1);
});
