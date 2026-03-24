export type EventEnvelopeV1<TPayload = Record<string, unknown>> = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  version: string;
  payload: TPayload;
};

export type OrderCreatedItem = {
  artworkId: string;
  quantity: number;
};

export type OrderCreatedPayload = {
  orderId: string;
  userId?: string;
  items: OrderCreatedItem[];
};

export type InventoryReservedPayload = {
  orderId: string;
  reservations: Array<{
    artworkId: string;
    quantity: number;
  }>;
};

export type InventoryFailedPayload = {
  orderId: string;
  reason: string;
  items: Array<{
    artworkId: string;
    requestedQty: number;
    availableQty: number;
  }>;
};
