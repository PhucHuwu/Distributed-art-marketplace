import { NotificationMessage } from './event';

export type NotificationSender = {
  send: (message: NotificationMessage) => Promise<void>;
};
