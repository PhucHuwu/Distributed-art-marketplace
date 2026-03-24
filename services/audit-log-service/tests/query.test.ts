import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuditWhere, parseLimit } from '../src/utils/query';

test('buildAuditWhere maps known filters', () => {
  const where = buildAuditWhere({
    userId: 'user-1',
    orderId: 'order-1',
    service: 'order-service',
    eventType: 'order.created',
    from: '2026-03-24T10:00:00.000Z',
    to: '2026-03-24T12:00:00.000Z',
  });

  assert.equal(where.userId, 'user-1');
  assert.equal(where.orderId, 'order-1');
  assert.equal(where.serviceName, 'order-service');
  assert.equal(where.eventType, 'order.created');
  assert.ok(where.occurredAt);
});

test('parseLimit returns bounded safe values', () => {
  assert.equal(parseLimit(undefined), 50);
  assert.equal(parseLimit('10'), 10);
  assert.equal(parseLimit('0'), 50);
  assert.equal(parseLimit('999'), 200);
  assert.equal(parseLimit('abc'), 50);
});
