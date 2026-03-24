import { logger } from '../lib/logger';
import { EventEnvelopeV1, NotificationMessage } from '../types/event';
import { NotificationSender } from '../types/provider';
import { ConsumerStats, NotificationConsumer, ProcessEventResult } from '../types/consumer';
import { mapEventToNotifications } from './notification-mapper';
import { dispatchWithRetry } from './notification-dispatcher';

export type NotificationConsumerDeps = {
  emailSender: NotificationSender;
  smsSender: NotificationSender;
  maxRetryCount: number;
  retryBackoffMs: number[];
};

const allowedEvents = new Set(['order.completed', 'order.failed', 'payment.failed']);

function buildStats(): ConsumerStats {
  return {
    processedEvents: 0,
    duplicatedEvents: 0,
    failedEvents: 0,
    retriedEvents: 0,
    sentNotifications: 0,
  };
}

function resolveSender(message: NotificationMessage, deps: NotificationConsumerDeps): NotificationSender {
  return message.channel === 'sms' ? deps.smsSender : deps.emailSender;
}

export function createNotificationConsumer(deps: NotificationConsumerDeps): NotificationConsumer {
  const processedEventIds = new Set<string>();
  const stats = buildStats();

  async function processEnvelope(envelope: EventEnvelopeV1): Promise<ProcessEventResult> {
    if (!allowedEvents.has(envelope.eventType)) {
      return {
        duplicated: false,
        sentCount: 0,
      };
    }

    if (processedEventIds.has(envelope.eventId)) {
      stats.duplicatedEvents += 1;
      logger.info(
        {
          eventId: envelope.eventId,
          correlationId: envelope.correlationId,
        },
        'Duplicate event skipped by idempotency guard',
      );

      return {
        duplicated: true,
        sentCount: 0,
      };
    }

    const messages = mapEventToNotifications(envelope);
    let sentCount = 0;

    try {
      for (const message of messages) {
        const sender = resolveSender(message, deps);
        const dispatch = await dispatchWithRetry(message, sender, deps, envelope.correlationId);

        sentCount += 1;
        stats.sentNotifications += 1;
        stats.retriedEvents += dispatch.retries;
      }
    } catch (error) {
      stats.failedEvents += 1;
      throw error;
    }

    processedEventIds.add(envelope.eventId);
    stats.processedEvents += 1;

    logger.info(
      {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        correlationId: envelope.correlationId,
        sentCount,
      },
      'Notification event processed',
    );

    return {
      duplicated: false,
      sentCount,
    };
  }

  function getStats(): ConsumerStats {
    return { ...stats };
  }

  return {
    processEnvelope,
    getStats,
  };
}
