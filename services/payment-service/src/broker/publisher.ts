import amqp, { Channel, ChannelModel } from 'amqplib';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';
import { EventEnvelopeV1, PrismaJsonObject } from '../types/event';

export type PaymentPublisherConfig = {
  rabbitmqUrl: string;
  exchange: string;
  producer: string;
  maxRetryCount: number;
  retryDelayMs: number;
};

export type PaymentPublisher = {
  publishEvent: (input: {
    eventType: 'payment.success' | 'payment.failed';
    correlationId: string;
    payload: PrismaJsonObject;
  }) => Promise<void>;
  close: () => Promise<void>;
};

type Runtime = {
  connection: ChannelModel;
  channel: Channel;
};

async function createRuntime(config: PaymentPublisherConfig): Promise<Runtime> {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(config.exchange, 'topic', { durable: true });

  return { connection, channel };
}

function buildEnvelope(input: {
  eventType: 'payment.success' | 'payment.failed';
  correlationId: string;
  payload: PrismaJsonObject;
  producer: string;
}): EventEnvelopeV1 {
  return {
    eventId: randomUUID(),
    eventType: input.eventType,
    occurredAt: new Date().toISOString(),
    producer: input.producer,
    correlationId: input.correlationId,
    version: 'v1',
    payload: input.payload,
  };
}

export async function createPaymentPublisher(config: PaymentPublisherConfig): Promise<PaymentPublisher> {
  const runtime = await createRuntime(config);

  async function publishEvent(input: {
    eventType: 'payment.success' | 'payment.failed';
    correlationId: string;
    payload: PrismaJsonObject;
  }): Promise<void> {
    const envelope = buildEnvelope({
      eventType: input.eventType,
      correlationId: input.correlationId,
      payload: input.payload,
      producer: config.producer,
    });

    let attempt = 0;
    while (attempt < config.maxRetryCount) {
      attempt += 1;

      try {
        const ok = runtime.channel.publish(
          config.exchange,
          input.eventType,
          Buffer.from(JSON.stringify(envelope), 'utf-8'),
          {
            contentType: 'application/json',
            persistent: true,
          },
        );

        if (!ok) {
          throw new Error('RabbitMQ channel backpressure while publishing message');
        }

        logger.info(
          {
            eventType: input.eventType,
            eventId: envelope.eventId,
            correlationId: input.correlationId,
          },
          'Payment domain event published',
        );
        return;
      } catch (error) {
        logger.error(
          {
            err: error,
            eventType: input.eventType,
            attempt,
            maxRetryCount: config.maxRetryCount,
            correlationId: input.correlationId,
          },
          'Failed to publish payment domain event',
        );

        if (attempt >= config.maxRetryCount) {
          throw error;
        }

        await delay(config.retryDelayMs * attempt);
      }
    }
  }

  async function close(): Promise<void> {
    await runtime.channel.close();
    await runtime.connection.close();
  }

  return {
    publishEvent,
    close,
  };
}
