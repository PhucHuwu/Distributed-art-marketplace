export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  correlationId?: string | null;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
  correlationId?: string | null;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type ApiError = {
  code: string;
  message: string;
  status: number;
  details: unknown[];
  correlationId: string | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuthToken = {
  token: string;
  tokenType: 'Bearer';
};

export type SessionUser = {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export type CatalogArtist = {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  artworkCount?: number;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
};

export type CatalogArtworkImage = {
  url: string;
  altText?: string | null;
  position: number;
};

export type CatalogArtwork = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  artist: CatalogArtist;
  categories: CatalogCategory[];
  images: CatalogArtworkImage[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters: {
    artist: string | null;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    q: string | null;
  };
};

export type InventoryStatus = {
  artworkId: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  updatedAt: string | null;
};

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

export type OrderStatus = 'PENDING' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type OrderItem = {
  id: string;
  artworkId: string;
  quantity: number;
  unitPrice: string;
};

export type ShippingAddress = {
  recipient: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  ward: string;
  district: string;
  city: string;
  postalCode?: string;
};

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

export type PaymentStatus = 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type Payment = {
  id: string;
  orderId: string;
  userId: string | null;
  amount: string;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
};

export type PaymentHistoryEntry = {
  id: string;
  fromStatus: PaymentStatus | null;
  toStatus: PaymentStatus;
  reason: string;
  correlationId: string;
  createdAt: string;
};

export type PaymentDetail = {
  payment: Payment;
  history: PaymentHistoryEntry[];
};

export type UserProfile = {
  id: string;
  userId: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserAddress = {
  id: string;
  userId: string;
  profileId: string;
  recipient: string;
  phoneNumber: string;
  line1: string;
  line2: string | null;
  ward: string;
  district: string;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressPayload = {
  recipient: string;
  phoneNumber: string;
  line1: string;
  line2?: string;
  ward: string;
  district: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
};
