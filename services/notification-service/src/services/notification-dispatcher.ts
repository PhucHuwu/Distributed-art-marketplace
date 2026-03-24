import { setTimeout as delay } from 'node:timers/promises';
import { logger } from '../lib/logger';
import { NotificationMessage } from '../types/event';
import { NotificationSender } from '../types/provider';

export type DispatchConfig = {
  maxRetryCount: number;
  retryBackoffMs: number[];
};

function getRetryDelay(backoffMs: number[], currentRetry: number): number {
  const index = Math.min(currentRetry, backoffMs.length - 1);
  return backoffMs[index] || 1000;
}

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { transient?: boolean }).transient === true;
}

export async function dispatchWithRetry(
  message: NotificationMessage,
  sender: NotificationSender,
  config: DispatchConfig,
  correlationId: string,
): Promise<{ retries: number }> {
  let attempt = 0;
  let retries = 0;

  while (attempt < config.maxRetryCount) {
    try {
      await sender.send(message);
      return { retries };
    } catch (error) {
      const transient = isTransientError(error);
      attempt += 1;
      retries += 1;

      logger.error(
        {
          err: error,
          channel: message.channel,
          to: message.to,
          attempt,
          maxRetryCount: config.maxRetryCount,
          correlationId,
        },
        'Notification send failed',
      );

      if (!transient || attempt >= config.maxRetryCount) {
        throw error;
      }

      await delay(getRetryDelay(config.retryBackoffMs, attempt - 1));
    }
  }

  return { retries };
}
