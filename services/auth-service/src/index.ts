import { env } from './config/env';
import { prisma } from './db/prisma';
import { eventPublisher } from './events/event.publisher';
import { createApp } from './app';
import { logger } from './shared/logger';

const bootstrap = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
  await eventPublisher.init();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info('Auth service started', { port: env.PORT });
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info('Graceful shutdown initiated', { signal });

    server.close(async () => {
      await eventPublisher.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
};

bootstrap().catch(async (error) => {
  logger.error('Failed to bootstrap auth service', { error });
  await eventPublisher.close();
  await prisma.$disconnect();
  process.exit(1);
});
