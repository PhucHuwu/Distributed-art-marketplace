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

export type EventEnvelopeV1 = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  version: string;
  payload: PrismaJsonObject;
};
