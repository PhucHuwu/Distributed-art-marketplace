import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationConsumer } from '../src/services/notification-consumer.service';
import { NotificationSender } from '../src/types/provider';

class MemorySender implements NotificationSender {
  public sent = 0;

  async send(): Promise<void> {
    this.sent += 1;
  }
}

test('processes event and sends notifications', async () => {
  const emailSender = new MemorySender();
  const smsSender = new MemorySender();

  const consumer = createNotificationConsumer({
    emailSender,
    smsSender,
    maxRetryCount: 3,
    retryBackoffMs: [1, 2, 3],
  });

  const result = await consumer.processEnvelope({
    eventId: 'evt-consume-1',
    eventType: 'order.completed',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'order-service',
    correlationId: 'corr-consume-1',
    version: 'v1',
    payload: {
      orderId: 'order-1',
      email: 'user@example.com',
      phone: '0123456789',
    },
  });

  assert.equal(result.duplicated, false);
  assert.equal(result.sentCount, 2);
  assert.equal(emailSender.sent, 1);
  assert.equal(smsSender.sent, 1);
});

test('skips duplicate event id', async () => {
  const emailSender = new MemorySender();
  const smsSender = new MemorySender();

  const consumer = createNotificationConsumer({
    emailSender,
    smsSender,
    maxRetryCount: 3,
    retryBackoffMs: [1, 2, 3],
  });

  await consumer.processEnvelope({
    eventId: 'evt-dup-1',
    eventType: 'order.failed',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'order-service',
    correlationId: 'corr-dup-1',
    version: 'v1',
    payload: {
      orderId: 'order-1',
      email: 'user@example.com',
    },
  });

  const duplicate = await consumer.processEnvelope({
    eventId: 'evt-dup-1',
    eventType: 'order.failed',
    occurredAt: '2026-03-24T10:00:00.000Z',
    producer: 'order-service',
    correlationId: 'corr-dup-1',
    version: 'v1',
    payload: {
      orderId: 'order-1',
      email: 'user@example.com',
    },
  });

  assert.equal(duplicate.duplicated, true);
  assert.equal(emailSender.sent, 1);
});
