import { http } from './http';
import type {
  AddressPayload,
  AuthToken,
  CatalogArtist,
  CatalogArtwork,
  CatalogCategory,
  CatalogArtworkImage,
  CatalogListMeta,
  Cart,
  InventoryStatus,
  Order,
  PaginationMeta,
  Payment,
  PaymentDetail,
  SessionUser,
  UserAddress,
  UserProfile,
} from './types';

export const authApi = {
  register: (email: string, password: string) =>
    http.post<AuthToken>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    http.post<AuthToken>('/auth/login', { email, password }),

  verify: () => http.get<SessionUser>('/auth/verify', true),
};

export interface CatalogParams {
  page?: number;
  limit?: number;
  q?: string;
  artist?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CatalogResult {
  items: CatalogArtwork[];
  meta: PaginationMeta;
}

function toQueryString(params: CatalogParams): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) {
    return '';
  }

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }

  return `?${search.toString()}`;
}

function normalizeArtwork(artwork: CatalogArtwork): CatalogArtwork {
  return {
    ...artwork,
    description: artwork.description || null,
    images: (artwork.images || []) as CatalogArtworkImage[],
    categories: artwork.categories || [],
  };
}

export const catalogApi = {
  listArtworks: async (params: CatalogParams = {}): Promise<CatalogResult> => {
    const path = `/catalog/artworks${toQueryString(params)}`;
    const result = await http.getWithMeta<CatalogArtwork[]>(path);
    const items = result.data.map(normalizeArtwork);
    const rawMeta = (result.meta || {}) as Partial<CatalogListMeta>;

    const meta: PaginationMeta = {
      page: Number(rawMeta.page || params.page || 1),
      limit: Number(rawMeta.limit || params.limit || 12),
      total: Number(rawMeta.total || items.length),
      totalPages: Number(rawMeta.totalPages || 1),
    };

    return { items, meta };
  },

  getArtwork: async (idOrSlug: string) => {
    const artwork = await http.get<CatalogArtwork>(`/catalog/artworks/${idOrSlug}`);
    return normalizeArtwork(artwork);
  },

  listArtists: () => http.get<CatalogArtist[]>('/catalog/artists'),

  listCategories: () => http.get<CatalogCategory[]>('/catalog/categories'),
};

export const inventoryApi = {
  getStatus: (artworkId: string) => http.get<InventoryStatus>(`/inventory/${artworkId}`),
};

export const cartApi = {
  getCart: () => http.get<Cart>('/orders/cart', true),

  addItem: (artworkId: string, quantity: number, unitPrice: number) =>
    http.post<Cart>('/orders/cart/items', { artworkId, quantity, unitPrice }, true),

  updateItem: (itemId: string, quantity: number) =>
    http.put<Cart>(`/orders/cart/items/${itemId}`, { quantity }, true),

  deleteItem: (itemId: string) => http.delete<Cart>(`/orders/cart/items/${itemId}`, true),
};

export const ordersApi = {
  createOrder: (shippingAddress: AddressPayload) =>
    http.post<Order>('/orders', { shippingAddress }, true),

  listMyOrders: () => http.get<Order[]>('/orders/me', true),

  getOrder: (orderId: string) => http.get<Order>(`/orders/${orderId}`, true),
};

export interface PaymentPayload {
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  userId?: string;
  processingResult?: 'SUCCESS' | 'FAILED';
}

export const paymentsApi = {
  createPayment: (payload: PaymentPayload) => http.post<Payment>('/payments', payload, true),

  getPayment: (id: string) => http.get<PaymentDetail>(`/payments/${id}`, true),
};

export const profileApi = {
  getMe: () => http.get<UserProfile>('/users/me', true),

  updateMe: (payload: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) =>
    http.put<UserProfile>('/users/me', payload, true),

  listAddresses: () => http.get<UserAddress[]>('/users/me/addresses', true),

  createAddress: (payload: AddressPayload) =>
    http.post<UserAddress>('/users/me/addresses', payload, true),

  updateAddress: (addressId: string, payload: Partial<AddressPayload>) =>
    http.put<UserAddress>(`/users/me/addresses/${addressId}`, payload, true),

  deleteAddress: (addressId: string) =>
    http.delete<{ deleted: true }>(`/users/me/addresses/${addressId}`, true),
};
