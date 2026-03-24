import test from 'node:test';
import assert from 'node:assert/strict';
import { processEventEnvelope } from '../src/services/process-event';

const baseEnvelope = {
  eventId: 'evt-process-1',
  eventType: 'order.created',
  occurredAt: '2026-03-24T10:00:00.000Z',
  producer: 'order-service',
  correlationId: 'corr-process-1',
  version: 'v1',
  payload: {
    orderId: 'order-1',
    userId: 'user-1',
  },
};

test('processEventEnvelope returns inserted=true when persist succeeds', async () => {
  const result = await processEventEnvelope(baseEnvelope, async () => true);

  assert.equal(result.inserted, true);
  assert.equal(result.eventId, 'evt-process-1');
  assert.equal(result.correlationId, 'corr-process-1');
});

test('processEventEnvelope returns inserted=false for duplicate event', async () => {
  const result = await processEventEnvelope(baseEnvelope, async () => false);

  assert.equal(result.inserted, false);
  assert.equal(result.eventId, 'evt-process-1');
});
