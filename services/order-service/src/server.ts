import 'dotenv/config';
import { createApp } from './app';
import { createBrokerConnection } from './broker';
import { startConsumer } from './broker/consumer';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  await prisma.$connect();

  const broker = await createBrokerConnection({
    rabbitmqUrl: config.rabbitmqUrl,
    exchange: config.rabbitmqExchange,
  });

  await startConsumer({
    rabbitmqUrl: config.rabbitmqUrl,
    exchange: config.rabbitmqExchange,
    queue: config.rabbitmqQueue,
    retryQueue: config.rabbitmqRetryQueue,
    dlqQueue: config.rabbitmqDlqQueue,
    dlx: config.rabbitmqDlx,
    retryDelaysMs: config.retryDelaysMs,
    routingKeys: config.consumeRoutingKeys,
    publishEvent: broker.publish,
    serviceName: config.serviceName,
  });

  const app = createApp({
    jwtSecret: config.jwtSecret,
    serviceName: config.serviceName,
    publishEvent: broker.publish,
  });

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Order service started');
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap order service');
  process.exit(1);
});
