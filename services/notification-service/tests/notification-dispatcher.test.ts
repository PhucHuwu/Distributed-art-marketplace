import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchWithRetry } from '../src/services/notification-dispatcher';
import { NotificationSender } from '../src/types/provider';
import { NotificationMessage } from '../src/types/event';

class FlakySender implements NotificationSender {
  private attempts = 0;

  async send(): Promise<void> {
    this.attempts += 1;

    if (this.attempts < 2) {
      const error = new Error('Temporary failure') as Error & { transient?: boolean };
      error.transient = true;
      throw error;
    }
  }
}

test('retries transient error and succeeds', async () => {
  const sender = new FlakySender();
  const message: NotificationMessage = {
    channel: 'email',
    to: 'user@example.com',
    subject: 'subject',
    body: 'body',
  };

  const result = await dispatchWithRetry(
    message,
    sender,
    {
      maxRetryCount: 3,
      retryBackoffMs: [1, 1, 1],
    },
    'corr-1',
  );

  assert.equal(result.retries, 1);
});
