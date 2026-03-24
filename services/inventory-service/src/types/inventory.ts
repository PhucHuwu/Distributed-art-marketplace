export type ReserveItemInput = {
  artworkId: string;
  quantity: number;
};

export type ReserveRequest = {
  reservationId: string;
  orderId: string;
  items: ReserveItemInput[];
};

export type ReleaseRequest = {
  reservationId: string;
};

export type AdjustRequest = {
  artworkId: string;
  deltaQty: number;
  reason?: string;
};
