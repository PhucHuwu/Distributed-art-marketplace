import 'dotenv/config';
import { createPaymentPublisher } from './broker/publisher';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  await prisma.$connect();

  const publisher = await createPaymentPublisher({
    rabbitmqUrl: config.rabbitmqUrl,
    exchange: config.rabbitmqExchange,
    producer: config.serviceName,
    maxRetryCount: config.maxPublishRetry,
    retryDelayMs: config.publishRetryDelayMs,
  });

  const app = createApp(config.serviceName, config.jwtSecret, publisher);

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Payment service started');
  });

  process.on('SIGINT', async () => {
    await publisher.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await publisher.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap payment service');
  process.exit(1);
});
