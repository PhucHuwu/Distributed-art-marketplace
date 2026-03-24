import { Channel } from 'amqplib';
import { EventEnvelopeV1 } from '../types/event';

export type Publisher = {
  publish: (routingKey: string, event: EventEnvelopeV1) => Promise<void>;
};

export function createPublisher(channel: Channel, exchange: string): Publisher {
  return {
    async publish(routingKey: string, event: EventEnvelopeV1): Promise<void> {
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(event)), {
        contentType: 'application/json',
        persistent: true,
      });
    },
  };
}
