import { request, requestWithMeta } from '@/lib/http-client';
import {
  CatalogArtist,
  CatalogArtwork,
  CatalogCategory,
  CatalogListMeta,
  CatalogQuery,
} from '@/types/catalog';

function toQueryString(query: CatalogQuery): string {
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) {
    return '';
  }

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }
  return `?${search.toString()}`;
}

export async function listArtworks(query: CatalogQuery) {
  const path = `/catalog/artworks${toQueryString(query)}`;
  const res = await requestWithMeta<CatalogArtwork[]>(path);
  return { data: res.data, meta: (res.meta as CatalogListMeta | undefined) || null };
}

export async function getArtwork(idOrSlug: string) {
  return request<CatalogArtwork>(`/catalog/artworks/${idOrSlug}`);
}

export async function listArtists() {
  return request<CatalogArtist[]>('/catalog/artists');
}

export async function listCategories() {
  return request<CatalogCategory[]>('/catalog/categories');
}
