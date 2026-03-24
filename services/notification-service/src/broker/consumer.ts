import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { setTimeout as delay } from 'node:timers/promises';
import { logger } from '../lib/logger';
import { NotificationConsumer } from '../types/consumer';
import { EventEnvelopeV1 } from '../types/event';

export type BrokerConsumerConfig = {
  rabbitmqUrl: string;
  exchange: string;
  queue: string;
  routingKeys: string[];
  maxRetryCount: number;
  retryBackoffMs: number[];
  dlx: string;
  dlq: string;
};

export type BrokerConsumerRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

function parseRetryCount(msg: ConsumeMessage): number {
  const header = msg.properties.headers?.['x-retry-count'];
  if (typeof header === 'number') {
    return header;
  }

  if (typeof header === 'string') {
    const parsed = Number(header);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

async function routeToDlq(
  channel: Channel,
  config: BrokerConsumerConfig,
  msg: ConsumeMessage,
  reason: string,
): Promise<void> {
  await channel.assertExchange(config.dlx, 'topic', { durable: true });
  await channel.assertQueue(config.dlq, { durable: true });
  await channel.bindQueue(config.dlq, config.dlx, config.dlq);

  channel.publish(config.dlx, config.dlq, msg.content, {
    contentType: msg.properties.contentType || 'application/json',
    persistent: true,
    headers: {
      ...(msg.properties.headers || {}),
      'x-failure-reason': reason,
      'x-retry-count': parseRetryCount(msg),
      'x-first-failed-at':
        msg.properties.headers?.['x-first-failed-at'] || new Date().toISOString(),
    },
  });
}

async function processMessage(
  msg: ConsumeMessage,
  channel: Channel,
  consumer: NotificationConsumer,
  config: BrokerConsumerConfig,
): Promise<void> {
  const retryCount = parseRetryCount(msg);
  const rawContent = msg.content.toString('utf-8');

  try {
    const envelope = JSON.parse(rawContent) as EventEnvelopeV1;
    await consumer.processEnvelope(envelope);
    channel.ack(msg);
  } catch (error) {
    logger.error(
      {
        err: error,
        rawContent,
        retryCount,
      },
      'Failed to process notification event',
    );

    if (retryCount >= config.maxRetryCount) {
      await routeToDlq(channel, config, msg, 'max_retry_exceeded');
      channel.ack(msg);
      return;
    }

    const nextRetryCount = retryCount + 1;
    const backoffMs = config.retryBackoffMs[Math.min(retryCount, config.retryBackoffMs.length - 1)] || 5000;

    await delay(backoffMs);

    channel.publish(config.exchange, msg.fields.routingKey, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType || 'application/json',
      headers: {
        ...(msg.properties.headers || {}),
        'x-retry-count': nextRetryCount,
        'x-first-failed-at':
          msg.properties.headers?.['x-first-failed-at'] || new Date().toISOString(),
      },
    });

    channel.ack(msg);
  }
}

export async function startBrokerConsumer(
  config: BrokerConsumerConfig,
  consumer: NotificationConsumer,
): Promise<BrokerConsumerRuntime> {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(config.exchange, 'topic', { durable: true });
  await channel.assertQueue(config.queue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': config.dlx,
      'x-dead-letter-routing-key': config.dlq,
    },
  });

  for (const routingKey of config.routingKeys) {
    await channel.bindQueue(config.queue, config.exchange, routingKey);
  }

  await channel.consume(config.queue, async (msg) => {
    if (!msg) {
      return;
    }

    await processMessage(msg, channel, consumer, config);
  });

  logger.info(
    {
      exchange: config.exchange,
      queue: config.queue,
      routingKeys: config.routingKeys,
    },
    'Notification broker consumer started',
  );

  return {
    connection,
    channel,
  };
}
