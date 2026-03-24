import { randomUUID } from 'node:crypto';
import { Channel } from 'amqplib';
import { logger } from '../lib/logger';
import { isEventProcessed, markEventProcessed, reserveStock } from './inventory.repository';
import {
  EventEnvelopeV1,
  InventoryFailedPayload,
  InventoryReservedPayload,
  OrderCreatedPayload,
} from '../types/event';
import { publishEvent } from '../broker/publisher';
import { HttpError } from '../utils/http-error';

type ReserveResult = Awaited<ReturnType<typeof reserveStock>>;

type ProcessorDeps = {
  isEventProcessed: typeof isEventProcessed;
  markEventProcessed: typeof markEventProcessed;
  reserveStock: typeof reserveStock;
  publishEvent: typeof publishEvent;
};

const defaultDeps: ProcessorDeps = {
  isEventProcessed,
  markEventProcessed,
  reserveStock,
  publishEvent,
};

function validateOrderCreatedPayload(payload: unknown): OrderCreatedPayload {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'order.created payload must be an object');
  }

  const body = payload as Record<string, unknown>;
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';

  if (!orderId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'order.created payload requires orderId');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'order.created payload requires non-empty items');
  }

  const items = body.items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new HttpError(400, 'VALIDATION_ERROR', `items[${index}] must be object`);
    }

    const value = item as Record<string, unknown>;
    const artworkId = typeof value.artworkId === 'string' ? value.artworkId.trim() : '';
    const quantity = Number(value.quantity);

    if (!artworkId) {
      throw new HttpError(400, 'VALIDATION_ERROR', `items[${index}].artworkId is required`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', `items[${index}].quantity must be positive integer`);
    }

    return {
      artworkId,
      quantity,
    };
  });

  return {
    orderId,
    userId: typeof body.userId === 'string' ? body.userId : undefined,
    items,
  };
}

function buildReservedEvent(
  input: EventEnvelopeV1<OrderCreatedPayload>,
  reserveResult: ReserveResult,
): EventEnvelopeV1<InventoryReservedPayload> {
  return {
    eventId: randomUUID(),
    eventType: 'inventory.reserved',
    occurredAt: new Date().toISOString(),
    producer: 'inventory-service',
    correlationId: input.correlationId,
    version: 'v1',
    payload: {
      orderId: reserveResult.orderId,
      reservations: input.payload.items.map((item) => ({
        artworkId: item.artworkId,
        quantity: item.quantity,
      })),
    },
  };
}

function buildFailedEvent(
  input: EventEnvelopeV1<OrderCreatedPayload>,
  reason: string,
  failures: InventoryFailedPayload['items'],
): EventEnvelopeV1<InventoryFailedPayload> {
  return {
    eventId: randomUUID(),
    eventType: 'inventory.failed',
    occurredAt: new Date().toISOString(),
    producer: 'inventory-service',
    correlationId: input.correlationId,
    version: 'v1',
    payload: {
      orderId: input.payload.orderId,
      reason,
      items: failures,
    },
  };
}

export async function processOrderCreatedEvent(
  channel: Channel,
  exchange: string,
  envelope: EventEnvelopeV1,
): Promise<{ inserted: boolean; emittedType?: 'inventory.reserved' | 'inventory.failed' }> {
  return processOrderCreatedEventWithDeps(channel, exchange, envelope, defaultDeps);
}

export async function processOrderCreatedEventWithDeps(
  channel: Channel,
  exchange: string,
  envelope: EventEnvelopeV1,
  deps: ProcessorDeps,
): Promise<{ inserted: boolean; emittedType?: 'inventory.reserved' | 'inventory.failed' }> {
  if (envelope.eventType !== 'order.created') {
    return { inserted: false };
  }

  const normalized = {
    ...envelope,
    payload: validateOrderCreatedPayload(envelope.payload),
  };

  const processedBefore = await deps.isEventProcessed(envelope.eventId);
  if (processedBefore) {
    logger.info({ eventId: envelope.eventId }, 'Duplicate order.created event ignored');
    return { inserted: false };
  }

  try {
    const reservationId = `order-${normalized.payload.orderId}`;

    const reserveResult = await deps.reserveStock({
      reservationId,
      orderId: normalized.payload.orderId,
      items: normalized.payload.items,
    });

    const marked = await deps.markEventProcessed(envelope.eventId, envelope.eventType, envelope.correlationId);
    if (!marked) {
      logger.info({ eventId: envelope.eventId }, 'Duplicate order.created event ignored');
      return { inserted: false };
    }

    const reservedEvent = buildReservedEvent(normalized, reserveResult);
    await deps.publishEvent(channel, exchange, 'inventory.reserved', reservedEvent);

    return { inserted: true, emittedType: 'inventory.reserved' };
  } catch (error) {
    const alreadyProcessed = await deps.isEventProcessed(envelope.eventId);
    if (alreadyProcessed) {
      logger.info({ eventId: envelope.eventId }, 'Duplicate order.created failure event ignored');
      return { inserted: false };
    }

    const marked = await deps.markEventProcessed(envelope.eventId, envelope.eventType, envelope.correlationId);
    if (!marked) {
      logger.info({ eventId: envelope.eventId }, 'Duplicate order.created failure event ignored');
      return { inserted: false };
    }

    const details = error instanceof HttpError ? error.details : [];
    const failureItems = Array.isArray(details)
      ? details
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            artworkId: String(item.artworkId || ''),
            requestedQty: Number(item.requestedQty || 0),
            availableQty: Number(item.availableQty || 0),
          }))
      : [];

    const failedEvent = buildFailedEvent(
      normalized,
      error instanceof Error ? error.message : 'Reserve failed',
      failureItems,
    );

    await deps.publishEvent(channel, exchange, 'inventory.failed', failedEvent);

    return { inserted: true, emittedType: 'inventory.failed' };
  }
}
