import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { logger } from '../lib/logger';
import { EventEnvelopeV1 } from '../types/event';
import { processOrderCreatedEvent } from '../services/event-processor';

export type ConsumerConfig = {
  rabbitmqUrl: string;
  exchange: string;
  queue: string;
  retryQueue: string;
  dlqQueue: string;
  dlx: string;
  routingKeys: string[];
  retryDelaysMs: number[];
};

export type ConsumerRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

type RetryHeader = {
  'x-retry-count'?: number;
};

async function publishToRetry(
  channel: Channel,
  retryQueue: string,
  msg: ConsumeMessage,
  retryCount: number,
  delayMs: number,
): Promise<void> {
  channel.sendToQueue(retryQueue, msg.content, {
    persistent: true,
    contentType: 'application/json',
    expiration: String(delayMs),
    headers: {
      ...(msg.properties.headers || {}),
      'x-retry-count': retryCount,
      'x-first-failed-at': msg.properties.headers?.['x-first-failed-at'] || new Date().toISOString(),
    },
  });
}

async function processMessage(msg: ConsumeMessage, channel: Channel, config: ConsumerConfig): Promise<void> {
  const rawContent = msg.content.toString('utf-8');
  const headers = (msg.properties.headers || {}) as RetryHeader;
  const retryCount = Number(headers['x-retry-count'] || 0);

  try {
    const parsed = JSON.parse(rawContent) as EventEnvelopeV1;
    await processOrderCreatedEvent(channel, config.exchange, parsed);
    channel.ack(msg);
  } catch (error) {
    logger.error(
      {
        err: error,
        rawContent,
        retryCount,
      },
      'Failed to process inventory consumer event',
    );

    if (retryCount < config.retryDelaysMs.length) {
      const nextRetryCount = retryCount + 1;
      const delay = config.retryDelaysMs[retryCount];
      await publishToRetry(channel, config.retryQueue, msg, nextRetryCount, delay);
      channel.ack(msg);
      return;
    }

    channel.sendToQueue(config.dlqQueue, msg.content, {
      persistent: true,
      contentType: 'application/json',
      headers: {
        ...(msg.properties.headers || {}),
        'x-retry-count': retryCount,
      },
    });
    channel.ack(msg);
  }
}

async function declareQueues(channel: Channel, config: ConsumerConfig): Promise<void> {
  await channel.assertExchange(config.exchange, 'topic', { durable: true });
  await channel.assertExchange(config.dlx, 'topic', { durable: true });

  await channel.assertQueue(config.queue, {
    durable: true,
  });

  await channel.assertQueue(config.retryQueue, {
    durable: true,
    deadLetterExchange: config.exchange,
    deadLetterRoutingKey: 'order.created',
  });

  await channel.assertQueue(config.dlqQueue, {
    durable: true,
  });

  for (const key of config.routingKeys) {
    await channel.bindQueue(config.queue, config.exchange, key);
  }
}

export async function startConsumer(config: ConsumerConfig): Promise<ConsumerRuntime> {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await declareQueues(channel, config);

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
      retryQueue: config.retryQueue,
      dlqQueue: config.dlqQueue,
      routingKeys: config.routingKeys,
    },
    'Inventory RabbitMQ consumer started',
  );

  return {
    connection,
    channel,
  };
}
