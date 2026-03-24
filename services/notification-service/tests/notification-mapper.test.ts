import test from 'node:test';
import assert from 'node:assert/strict';
import { mapEventToNotifications } from '../src/services/notification-mapper';

test('maps order.completed to email and sms', () => {
  const messages = mapEventToNotifications({
    eventId: 'evt-1',
    eventType: 'order.completed',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'order-service',
    correlationId: 'corr-1',
    version: 'v1',
    payload: {
      orderId: 'order-1',
      email: 'user@example.com',
      phone: '0123456789',
    },
  });

  assert.equal(messages.length, 2);
});

test('maps payment.failed to one email notification', () => {
  const messages = mapEventToNotifications({
    eventId: 'evt-2',
    eventType: 'payment.failed',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'payment-service',
    correlationId: 'corr-2',
    version: 'v1',
    payload: {
      paymentId: 'pay-1',
      orderId: 'order-1',
      email: 'user@example.com',
      failureMessage: 'Card declined',
    },
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].channel, 'email');
});
