export interface EventEnvelope<TPayload> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  source: string;
  payload: TPayload;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  role: string;
}

export interface UserLoginSucceededPayload {
  userId: string;
  email: string;
  role: string;
}
