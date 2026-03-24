import amqp, { type Channel, type ChannelModel } from 'amqplib';

import { env } from '../config/env';
import { logger } from '../shared/logger';
import type { EventEnvelope } from './event.types';

class EventPublisher {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  async init(): Promise<void> {
    if (!env.RABBITMQ_URL) {
      logger.warn('RabbitMQ chưa được cấu hình, service sẽ bỏ qua publish event');
      return;
    }

    this.connection = await amqp.connect(env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(env.EVENT_EXCHANGE, 'topic', { durable: true });
    await this.channel.assertExchange(env.EVENT_DLX_EXCHANGE, 'topic', { durable: true });
    await this.channel.assertQueue(env.EVENT_DLQ_QUEUE, { durable: true });
    await this.channel.bindQueue(env.EVENT_DLQ_QUEUE, env.EVENT_DLX_EXCHANGE, '#');
  }

  async publish<TPayload>(routingKey: string, event: EventEnvelope<TPayload>): Promise<void> {
    if (!this.channel) {
      return;
    }

    const payload = Buffer.from(JSON.stringify(event));

    for (let attempt = 1; attempt <= env.EVENT_PUBLISH_RETRY; attempt += 1) {
      try {
        const published = this.channel.publish(env.EVENT_EXCHANGE, routingKey, payload, {
          contentType: 'application/json',
          persistent: true,
          messageId: event.eventId,
          timestamp: Date.now(),
          type: event.eventType,
        });

        if (!published) {
          throw new Error('RabbitMQ buffer đầy, publish thất bại');
        }

        return;
      } catch (error) {
        if (attempt === env.EVENT_PUBLISH_RETRY) {
          logger.error('Publish event thất bại, chuyển DLQ', {
            routingKey,
            event,
            error,
          });

          this.channel.publish(env.EVENT_DLX_EXCHANGE, routingKey, payload, {
            contentType: 'application/json',
            persistent: true,
            messageId: event.eventId,
            timestamp: Date.now(),
            type: event.eventType,
          });

          return;
        }

        logger.warn('Publish event thất bại, thử lại', {
          routingKey,
          attempt,
          eventId: event.eventId,
        });
      }
    }
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

export const eventPublisher = new EventPublisher();
