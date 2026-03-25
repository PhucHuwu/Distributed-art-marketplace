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
  AdminAuditLog,
  UserAddress,
  UserProfile,
} from './types';

export const authApi = {
  register: (email: string, password: string) =>
    requestWithFallbackPath<AuthToken>(
      '/auth/auth/register',
      '/auth/register',
      (path) => http.post<AuthToken>(path, { email, password }),
    ),

  login: (email: string, password: string) =>
    requestWithFallbackPath<AuthToken>('/auth/auth/login', '/auth/login', (path) =>
      http.post<AuthToken>(path, { email, password }),
    ),

  verify: () =>
    requestWithFallbackPath<SessionUser>('/auth/auth/verify', '/auth/verify', (path) =>
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
      `/catalog/catalog/artworks${query}`,
      `/catalog/artworks${query}`,
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
        `/catalog/catalog/artworks/${idOrSlug}`,
        `/catalog/artworks/${idOrSlug}`,
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
        `/catalog/catalog/artworks/${matched.id}`,
        `/catalog/artworks/${matched.id}`,
        (path) => http.get<CatalogArtwork>(path),
      );

      return normalizeArtwork(artworkById);
    }
  },

  listArtists: () =>
    requestWithFallbackPath<CatalogArtist[]>('/catalog/catalog/artists', '/catalog/artists', (path) =>
      http.get<CatalogArtist[]>(path),
    ),

  listCategories: () =>
    requestWithFallbackPath<CatalogCategory[]>(
      '/catalog/catalog/categories',
      '/catalog/categories',
      (path) => http.get<CatalogCategory[]>(path),
    ),
};

export const inventoryApi = {
  getStatus: (artworkId: string) =>
    requestWithFallbackPath<InventoryStatus>(
      `/inventory/inventory/${artworkId}`,
      `/inventory/${artworkId}`,
      (path) => http.get<InventoryStatus>(path),
    ),

  adjustStock: (payload: { artworkId: string; deltaQty: number; reason?: string }) =>
    requestWithFallbackPath<InventoryStatus>(
      '/inventory/inventory/adjust',
      '/inventory/adjust',
      (path) => http.post<InventoryStatus>(path, payload, true),
    ),
};

export type AdminArtistPayload = {
  name: string;
  slug: string;
  bio?: string;
};

export type AdminCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
};

export type AdminArtworkPayload = {
  title: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  artistId: string;
  categoryIds: string[];
  images: Array<{ url: string; altText?: string; position: number }>;
};

export const adminCatalogApi = {
  createArtist: (payload: AdminArtistPayload) =>
    requestWithFallbackPath<CatalogArtist>('/catalog/catalog/artists', '/catalog/artists', (path) =>
      http.post<CatalogArtist>(path, payload, true),
    ),

  updateArtist: (artistId: string, payload: AdminArtistPayload) =>
    requestWithFallbackPath<CatalogArtist>(
      `/catalog/catalog/artists/${artistId}`,
      `/catalog/artists/${artistId}`,
      (path) => http.put<CatalogArtist>(path, payload, true),
    ),

  deleteArtist: (artistId: string) =>
    requestWithFallbackPath<{ deleted: true }>(
      `/catalog/catalog/artists/${artistId}`,
      `/catalog/artists/${artistId}`,
      (path) => http.delete<{ deleted: true }>(path, true),
    ),

  createCategory: (payload: AdminCategoryPayload) =>
    requestWithFallbackPath<CatalogCategory>('/catalog/catalog/categories', '/catalog/categories', (path) =>
      http.post<CatalogCategory>(path, payload, true),
    ),

  updateCategory: (categoryId: string, payload: AdminCategoryPayload) =>
    requestWithFallbackPath<CatalogCategory>(
      `/catalog/catalog/categories/${categoryId}`,
      `/catalog/categories/${categoryId}`,
      (path) => http.put<CatalogCategory>(path, payload, true),
    ),

  deleteCategory: (categoryId: string) =>
    requestWithFallbackPath<{ deleted: true }>(
      `/catalog/catalog/categories/${categoryId}`,
      `/catalog/categories/${categoryId}`,
      (path) => http.delete<{ deleted: true }>(path, true),
    ),

  createArtwork: (payload: AdminArtworkPayload) =>
    requestWithFallbackPath<CatalogArtwork>('/catalog/catalog/artworks', '/catalog/artworks', (path) =>
      http.post<CatalogArtwork>(path, payload, true),
    ),

  updateArtwork: (artworkId: string, payload: AdminArtworkPayload) =>
    requestWithFallbackPath<CatalogArtwork>(
      `/catalog/catalog/artworks/${artworkId}`,
      `/catalog/artworks/${artworkId}`,
      (path) => http.put<CatalogArtwork>(path, payload, true),
    ),

  deleteArtwork: (artworkId: string) =>
    requestWithFallbackPath<{ deleted: true }>(
      `/catalog/catalog/artworks/${artworkId}`,
      `/catalog/artworks/${artworkId}`,
      (path) => http.delete<{ deleted: true }>(path, true),
    ),
};

export type AdminAuditQuery = {
  userId?: string;
  orderId?: string;
  service?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
};

function toAdminAuditQueryString(params: AdminAuditQuery): string {
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

export const adminAuditApi = {
  listLogs: async (query: AdminAuditQuery = {}) => {
    const queryString = toAdminAuditQueryString(query);
    const result = await requestWithFallbackPath<{ data: AdminAuditLog[]; meta?: { count?: number; limit?: number } }>(
      `/admin/audit-logs/admin/audit-logs${queryString}`,
      `/admin/audit-logs${queryString}`,
      (path) => http.getWithMeta<AdminAuditLog[]>(path, true),
    );

    return {
      items: result.data,
      meta: {
        count: Number(result.meta?.count || result.data.length),
        limit: Number(result.meta?.limit || query.limit || 50),
      },
    };
  },

  getLogByEventId: (eventId: string) =>
    requestWithFallbackPath<AdminAuditLog>(
      `/admin/audit-logs/admin/audit-logs/${eventId}`,
      `/admin/audit-logs/${eventId}`,
      (path) => http.get<AdminAuditLog>(path, true),
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
