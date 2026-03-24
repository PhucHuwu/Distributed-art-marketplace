import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { logger } from '../lib/logger';
import { processOrderEvent } from '../services/order-event.service';
import { EventEnvelopeV1 } from '../types/event';

export type ConsumerConfig = {
  rabbitmqUrl: string;
  exchange: string;
  queue: string;
  retryQueue: string;
  dlqQueue: string;
  dlx: string;
  retryDelaysMs: number[];
  routingKeys: string[];
  publishEvent: (routingKey: string, event: EventEnvelopeV1) => Promise<void>;
  serviceName: string;
};

export type ConsumerRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

function getRetryCount(msg: ConsumeMessage): number {
  const headers = msg.properties.headers || {};
  const headerValue = headers['x-retry-count'];
  if (typeof headerValue === 'number' && Number.isFinite(headerValue)) {
    return headerValue;
  }

  if (typeof headerValue === 'string') {
    const value = Number(headerValue);
    return Number.isFinite(value) ? value : 0;
  }

  return 0;
}

async function processMessage(msg: ConsumeMessage, channel: Channel, config: ConsumerConfig): Promise<void> {
  const rawContent = msg.content.toString('utf-8');
  const headers = msg.properties.headers || {};

  try {
    const parsed = JSON.parse(rawContent) as EventEnvelopeV1;
    await processOrderEvent(parsed, {
      publishEvent: config.publishEvent,
      serviceName: config.serviceName,
    });
    channel.ack(msg);
  } catch (error) {
    const retryCount = getRetryCount(msg);
    const hasRemainingRetry = retryCount < config.retryDelaysMs.length;
    const correlationId = (headers['x-correlation-id'] || null) as string | null;

    if (hasRemainingRetry) {
      const nextRetryCount = retryCount + 1;
      const delayMs = config.retryDelaysMs[retryCount];

      channel.sendToQueue(config.retryQueue, msg.content, {
        contentType: msg.properties.contentType || 'application/json',
        persistent: true,
        expiration: String(delayMs),
        headers: {
          ...headers,
          'x-retry-count': nextRetryCount,
          'x-first-failed-at':
            headers['x-first-failed-at'] || new Date().toISOString(),
          'x-correlation-id': correlationId,
        },
      });

      channel.ack(msg);

      logger.warn(
        {
          err: error,
          retryCount: nextRetryCount,
          delayMs,
          routingKey: msg.fields.routingKey,
          correlationId,
        },
        'Order lifecycle event failed and moved to retry queue',
      );

      return;
    }

    channel.publish(config.dlx, msg.fields.routingKey, msg.content, {
      contentType: msg.properties.contentType || 'application/json',
      persistent: true,
      headers: {
        ...headers,
        'x-retry-count': retryCount,
        'x-failed-at': new Date().toISOString(),
      },
    });

    channel.ack(msg);

    logger.error(
      {
        err: error,
        rawContent,
        retryCount,
        routingKey: msg.fields.routingKey,
        correlationId,
      },
      'Order lifecycle event moved to DLQ after max retries',
    );
  }
}

export async function startConsumer(config: ConsumerConfig): Promise<ConsumerRuntime> {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(config.exchange, 'topic', { durable: true });
  await channel.assertExchange(config.dlx, 'topic', { durable: true });

  await channel.assertQueue(config.queue, { durable: true });
  await channel.assertQueue(config.retryQueue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': config.queue,
    },
  });
  await channel.assertQueue(config.dlqQueue, { durable: true });
  await channel.bindQueue(config.dlqQueue, config.dlx, '#');

  for (const key of config.routingKeys) {
    await channel.bindQueue(config.queue, config.exchange, key);
  }

  await channel.consume(config.queue, async (msg) => {
    if (!msg) {
      return;
    }

    await processMessage(msg, channel, config);
  });

  logger.info(
    {
      exchange: config.exchange,
      queue: config.queue,
      routingKeys: config.routingKeys,
    },
    'Order service consumer started',
  );

  return {
    connection,
    channel,
  };
}
