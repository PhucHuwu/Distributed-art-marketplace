import assert from 'node:assert/strict';
import test from 'node:test';
import { processOrderCreatedEventWithDeps } from '../src/services/event-processor';

const baseEnvelope = {
  eventId: 'evt-order-created-1',
  eventType: 'order.created',
  occurredAt: '2026-03-24T10:00:00.000Z',
  producer: 'order-service',
  correlationId: 'corr-1',
  version: 'v1',
  payload: {
    orderId: 'order-1',
    items: [{ artworkId: 'a1', quantity: 2 }],
  },
};

function createDeps(overrides?: Partial<Parameters<typeof processOrderCreatedEventWithDeps>[3]>) {
  const published: Array<{ routingKey: string; eventType: string }> = [];

  const deps: Parameters<typeof processOrderCreatedEventWithDeps>[3] = {
    isEventProcessed: async () => false,
    markEventProcessed: async () => true,
    reserveStock: async () => ({
      reservationId: 'order-order-1',
      orderId: 'order-1',
      status: 'RESERVED',
    }),
    publishEvent: async (_channel, _exchange, routingKey, event) => {
      published.push({ routingKey, eventType: event.eventType });
    },
    ...overrides,
  };

  return { deps, published };
}

test('processOrderCreatedEvent emits inventory.reserved on reserve success', async () => {
  const { deps, published } = createDeps();

  const result = await processOrderCreatedEventWithDeps(
    {} as never,
    'dam.domain.events.v1',
    baseEnvelope,
    deps,
  );

  assert.equal(result.inserted, true);
  assert.equal(result.emittedType, 'inventory.reserved');
  assert.equal(published.length, 1);
  assert.equal(published[0].routingKey, 'inventory.reserved');
});

test('processOrderCreatedEvent emits inventory.failed when reserve fails', async () => {
  const { deps, published } = createDeps({
    reserveStock: async () => {
      throw new Error('boom');
    },
  });

  const result = await processOrderCreatedEventWithDeps(
    {} as never,
    'dam.domain.events.v1',
    baseEnvelope,
    deps,
  );

  assert.equal(result.inserted, true);
  assert.equal(result.emittedType, 'inventory.failed');
  assert.equal(published.length, 1);
  assert.equal(published[0].routingKey, 'inventory.failed');
});

test('processOrderCreatedEvent skips duplicate event', async () => {
  const { deps, published } = createDeps({
    markEventProcessed: async () => false,
  });

  const result = await processOrderCreatedEventWithDeps(
    {} as never,
    'dam.domain.events.v1',
    baseEnvelope,
    deps,
  );

  assert.equal(result.inserted, false);
  assert.equal(published.length, 0);
});
