import { http, isApiError } from './http';
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
    requestWithFallbackPath<AuthToken>(
      '/auth/register',
      '/auth/auth/register',
      (path) => http.post<AuthToken>(path, { email, password }),
    ),

  login: (email: string, password: string) =>
    requestWithFallbackPath<AuthToken>('/auth/login', '/auth/auth/login', (path) =>
      http.post<AuthToken>(path, { email, password }),
    ),

  verify: () =>
    requestWithFallbackPath<SessionUser>('/auth/verify', '/auth/auth/verify', (path) =>
      http.get<SessionUser>(path, true),
    ),
};

async function requestWithFallbackPath<T>(
  primaryPath: string,
  fallbackPath: string,
  requester: (path: string) => Promise<T>,
): Promise<T> {
  try {
    return await requester(primaryPath);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return requester(fallbackPath);
    }

    throw error;
  }
}

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
    const query = toQueryString(params);
    const result = await requestWithFallbackPath<{ data: CatalogArtwork[]; meta?: Record<string, unknown> }>(
      `/catalog/artworks${query}`,
      `/catalog/catalog/artworks${query}`,
      (path) => http.getWithMeta<CatalogArtwork[]>(path),
    );
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
    try {
      const artwork = await requestWithFallbackPath<CatalogArtwork>(
        `/catalog/artworks/${idOrSlug}`,
        `/catalog/catalog/artworks/${idOrSlug}`,
        (path) => http.get<CatalogArtwork>(path),
      );
      return normalizeArtwork(artwork);
    } catch (error) {
      if (!isApiError(error) || error.status < 500) {
        throw error;
      }

      const searchResult = await catalogApi.listArtworks({ q: idOrSlug, page: 1, limit: 50 });
      const matched = searchResult.items.find(
        (item) => item.slug === idOrSlug || item.id === idOrSlug,
      );

      if (!matched) {
        throw error;
      }

      const artworkById = await requestWithFallbackPath<CatalogArtwork>(
        `/catalog/artworks/${matched.id}`,
        `/catalog/catalog/artworks/${matched.id}`,
        (path) => http.get<CatalogArtwork>(path),
      );

      return normalizeArtwork(artworkById);
    }
  },

  listArtists: () =>
    requestWithFallbackPath<CatalogArtist[]>('/catalog/artists', '/catalog/catalog/artists', (path) =>
      http.get<CatalogArtist[]>(path),
    ),

  listCategories: () =>
    requestWithFallbackPath<CatalogCategory[]>(
      '/catalog/categories',
      '/catalog/catalog/categories',
      (path) => http.get<CatalogCategory[]>(path),
    ),
};

export const inventoryApi = {
  getStatus: (artworkId: string) =>
    requestWithFallbackPath<InventoryStatus>(
      `/inventory/${artworkId}`,
      `/inventory/inventory/${artworkId}`,
      (path) => http.get<InventoryStatus>(path),
    ),
};

export const cartApi = {
  getCart: () =>
    requestWithFallbackPath<Cart>('/orders/cart', '/orders/orders/cart', (path) =>
      http.get<Cart>(path, true),
    ),

  addItem: (artworkId: string, quantity: number, unitPrice: number) =>
    requestWithFallbackPath<Cart>('/orders/cart/items', '/orders/orders/cart/items', (path) =>
      http.post<Cart>(path, { artworkId, quantity, unitPrice }, true),
    ),

  updateItem: (itemId: string, quantity: number) =>
    requestWithFallbackPath<Cart>(
      `/orders/cart/items/${itemId}`,
      `/orders/orders/cart/items/${itemId}`,
      (path) => http.put<Cart>(path, { quantity }, true),
    ),

  deleteItem: (itemId: string) =>
    requestWithFallbackPath<Cart>(
      `/orders/cart/items/${itemId}`,
      `/orders/orders/cart/items/${itemId}`,
      (path) => http.delete<Cart>(path, true),
    ),
};

export const ordersApi = {
  createOrder: (shippingAddress: AddressPayload) =>
    requestWithFallbackPath<Order>('/orders', '/orders/orders', (path) =>
      http.post<Order>(path, { shippingAddress }, true),
    ),

  listMyOrders: () =>
    requestWithFallbackPath<Order[]>('/orders/me', '/orders/orders/me', (path) =>
      http.get<Order[]>(path, true),
    ),

  getOrder: (orderId: string) =>
    requestWithFallbackPath<Order>(`/orders/${orderId}`, `/orders/orders/${orderId}`, (path) =>
      http.get<Order>(path, true),
    ),
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
  createPayment: (payload: PaymentPayload) =>
    requestWithFallbackPath<Payment>('/payments', '/payments/payments', (path) =>
      http.post<Payment>(path, payload, true),
    ),

  getPayment: (id: string) =>
    requestWithFallbackPath<PaymentDetail>(`/payments/${id}`, `/payments/payments/${id}`, (path) =>
      http.get<PaymentDetail>(path, true),
    ),
};

export const profileApi = {
  getMe: () =>
    requestWithFallbackPath<UserProfile>('/users/me', '/users/users/me', (path) =>
      http.get<UserProfile>(path, true),
    ),

  updateMe: (payload: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) =>
    requestWithFallbackPath<UserProfile>('/users/me', '/users/users/me', (path) =>
      http.put<UserProfile>(path, payload, true),
    ),

  listAddresses: () =>
    requestWithFallbackPath<UserAddress[]>('/users/me/addresses', '/users/users/me/addresses', (path) =>
      http.get<UserAddress[]>(path, true),
    ),

  createAddress: (payload: AddressPayload) =>
    requestWithFallbackPath<UserAddress>('/users/me/addresses', '/users/users/me/addresses', (path) =>
      http.post<UserAddress>(path, payload, true),
    ),

  updateAddress: (addressId: string, payload: Partial<AddressPayload>) =>
    requestWithFallbackPath<UserAddress>(
      `/users/me/addresses/${addressId}`,
      `/users/users/me/addresses/${addressId}`,
      (path) => http.put<UserAddress>(path, payload, true),
    ),

  deleteAddress: (addressId: string) =>
    requestWithFallbackPath<{ deleted: true }>(
      `/users/me/addresses/${addressId}`,
      `/users/users/me/addresses/${addressId}`,
      (path) => http.delete<{ deleted: true }>(path, true),
    ),
};
