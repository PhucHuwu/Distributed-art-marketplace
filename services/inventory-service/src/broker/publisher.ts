import { Channel } from 'amqplib';
import { logger } from '../lib/logger';
import { EventEnvelopeV1 } from '../types/event';

export async function publishEvent(
  channel: Channel,
  exchange: string,
  routingKey: string,
  event: EventEnvelopeV1,
): Promise<void> {
  const payload = Buffer.from(JSON.stringify(event));
  const published = channel.publish(exchange, routingKey, payload, {
    contentType: 'application/json',
    persistent: true,
    headers: {
      'x-retry-count': 0,
    },
  });

  if (!published) {
    logger.warn({ routingKey, eventId: event.eventId }, 'Publish backpressure detected on channel');
  }
}
