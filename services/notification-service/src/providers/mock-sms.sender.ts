import { logger } from '../lib/logger';
import { NotificationSender } from '../types/provider';
import { NotificationMessage } from '../types/event';

export class MockSmsSender implements NotificationSender {
  async send(message: NotificationMessage): Promise<void> {
    logger.info(
      {
        channel: message.channel,
        to: message.to,
        subject: message.subject,
      },
      'Mock sms sent',
    );
  }
}
