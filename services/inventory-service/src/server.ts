import 'dotenv/config';
import { startConsumer } from './broker/consumer';
import { createApp } from './app';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  const app = createApp(config.jwtSecret, config.serviceName);

  await prisma.$connect();

  await startConsumer({
    rabbitmqUrl: config.rabbitmqUrl,
    exchange: config.rabbitmqExchange,
    queue: config.rabbitmqQueue,
    retryQueue: config.rabbitmqRetryQueue,
    dlqQueue: config.rabbitmqDlqQueue,
    dlx: config.rabbitmqDlx,
    routingKeys: config.consumeRoutingKeys,
    retryDelaysMs: config.retryDelaysMs,
  });

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Inventory service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap inventory service');
  process.exit(1);
});
