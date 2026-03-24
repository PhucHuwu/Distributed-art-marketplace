import 'dotenv/config';
import { startBrokerConsumer } from './broker/consumer';
import { getEnvConfig } from './config/env';
import { logger } from './lib/logger';
import { MockEmailSender } from './providers/mock-email.sender';
import { MockSmsSender } from './providers/mock-sms.sender';
import { createApp } from './app';
import { createNotificationConsumer } from './services/notification-consumer.service';

async function bootstrap(): Promise<void> {
  const config = getEnvConfig();

  const consumer = createNotificationConsumer({
    emailSender: new MockEmailSender(),
    smsSender: new MockSmsSender(),
    maxRetryCount: config.maxRetryCount,
    retryBackoffMs: config.retryBackoffMs,
  });

  const runtime = await startBrokerConsumer(
    {
      rabbitmqUrl: config.rabbitmqUrl,
      exchange: config.rabbitmqExchange,
      queue: config.rabbitmqQueue,
      routingKeys: config.rabbitmqRoutingKeys,
      maxRetryCount: config.maxRetryCount,
      retryBackoffMs: config.retryBackoffMs,
      dlx: config.dlx,
      dlq: config.dlq,
    },
    consumer,
  );

  const app = createApp(config.serviceName, consumer);

  app.listen(config.servicePort, () => {
    logger.info({ servicePort: config.servicePort }, 'Notification service started');
  });

  process.on('SIGINT', async () => {
    await runtime.channel.close();
    await runtime.connection.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await runtime.channel.close();
    await runtime.connection.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to bootstrap notification service');
  process.exit(1);
});
