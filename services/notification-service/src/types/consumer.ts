import { EventEnvelopeV1 } from './event';

export type ConsumerStats = {
  processedEvents: number;
  duplicatedEvents: number;
  failedEvents: number;
  retriedEvents: number;
  sentNotifications: number;
};

export type ProcessEventResult = {
  duplicated: boolean;
  sentCount: number;
};

export type NotificationConsumer = {
  processEnvelope: (envelope: EventEnvelopeV1) => Promise<ProcessEventResult>;
  getStats: () => ConsumerStats;
};
