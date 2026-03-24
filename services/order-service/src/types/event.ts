export type EventEnvelopeV1<TPayload = Record<string, unknown>> = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  version: string;
  payload: TPayload;
};

export type OrderCreatedPayload = {
  orderId: string;
  userId: string;
  items: Array<{
    artworkId: string;
    quantity: number;
    unitPrice: string;
  }>;
  totalAmount: string;
  currency: string;
  shippingAddress: Record<string, unknown>;
};

export type OrderCompletedPayload = {
  orderId: string;
  userId: string;
  paymentId?: string;
};

export type OrderFailedPayload = {
  orderId: string;
  userId: string;
  reason: string;
};

export type InventoryReservedPayload = {
  orderId: string;
  reservations?: Array<{
    artworkId: string;
    quantity: number;
  }>;
};

export type InventoryFailedPayload = {
  orderId: string;
  reason: string;
};

export type PaymentSuccessPayload = {
  orderId: string;
  paymentId?: string;
};

export type PaymentFailedPayload = {
  orderId: string;
  reason?: string;
};
