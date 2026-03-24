import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvent } from '../src/services/event-normalizer';

test('normalizeEvent maps required audit fields', () => {
  const event = normalizeEvent({
    eventId: 'evt-1',
    eventType: 'order.created',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'order-service',
    correlationId: 'corr-1',
    version: 'v1',
    payload: {
      orderId: 'order-1',
      userId: 'user-1',
    },
  });

  assert.equal(event.eventId, 'evt-1');
  assert.equal(event.eventType, 'order.created');
  assert.equal(event.serviceName, 'order-service');
  assert.equal(event.orderId, 'order-1');
  assert.equal(event.userId, 'user-1');
  assert.equal(event.aggregateId, 'order-1');
});

test('normalizeEvent throws for invalid envelope', () => {
  assert.throws(() => {
    normalizeEvent({
      eventId: '',
      eventType: 'order.created',
      occurredAt: '2026-03-24T10:00:00.000Z',
      producer: 'order-service',
      correlationId: 'corr-1',
      version: 'v1',
      payload: {},
    });
  });
});
