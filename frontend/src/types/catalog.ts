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

export type CatalogQuery = {
  page?: number;
  limit?: number;
  artist?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
};
