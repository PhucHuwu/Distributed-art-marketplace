export type CartItem = {
  id: string;
  artworkId: string;
  quantity: number;
  unitPrice: string;
};

export type Cart = {
  id: string;
  userId: string;
  status: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  artworkId: string;
  quantity: number;
  unitPrice: string;
};

export type OrderStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: string;
  currency: string;
  shippingAddress: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};
