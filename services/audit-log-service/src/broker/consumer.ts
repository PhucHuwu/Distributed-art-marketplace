import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { logger } from '../lib/logger';
import { saveAuditLog } from '../services/audit-log.service';
import { processEventEnvelope } from '../services/process-event';
import { EventEnvelopeV1 } from '../types/event';

export type ConsumerConfig = {
  rabbitmqUrl: string;
  exchange: string;
  queue: string;
  routingKeys: string[];
  maxRetryCount: number;
  retryDelayMs: number;
};

export type ConsumerRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

async function processMessage(msg: ConsumeMessage, channel: Channel): Promise<void> {
  const rawContent = msg.content.toString('utf-8');

  try {
    const parsed = JSON.parse(rawContent) as EventEnvelopeV1;
    await processEventEnvelope(parsed, saveAuditLog);

    channel.ack(msg);
  } catch (error) {
    logger.error({ err: error, rawContent }, 'Failed to process event message');
    channel.nack(msg, false, false);
  }
}

export async function startConsumer(config: ConsumerConfig): Promise<ConsumerRuntime> {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(config.exchange, 'topic', { durable: true });
  await channel.assertQueue(config.queue, { durable: true });

  for (const key of config.routingKeys) {
    await channel.bindQueue(config.queue, config.exchange, key);
  }

  await channel.consume(config.queue, async (msg) => {
    if (!msg) {
      return;
    }

    await processMessage(msg, channel);
  });

  logger.info(
    {
      exchange: config.exchange,
      queue: config.queue,
      routingKeys: config.routingKeys,
    },
    'RabbitMQ consumer started',
  );

  return {
    connection,
    channel,
  };
}
