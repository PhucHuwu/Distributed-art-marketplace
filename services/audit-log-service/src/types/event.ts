export type EventEnvelopeV1 = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  version: string;
  payload: PrismaJsonObject;
};

export type NormalizedAuditEvent = {
  eventId: string;
  eventType: string;
  serviceName: string;
  aggregateId: string | null;
  orderId: string | null;
  userId: string | null;
  payload: PrismaJsonObject;
  occurredAt: Date;
  correlationId: string;
  version: string;
};

export type PrismaJsonValue =
  | string
  | number
  | boolean
  | null
  | PrismaJsonObject
  | PrismaJsonValue[];

export type PrismaJsonObject = {
  [key: string]: PrismaJsonValue;
};
