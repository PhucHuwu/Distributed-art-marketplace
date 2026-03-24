export type ArtworkListQuery = {
  page?: string;
  limit?: string;
  artist?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
};

export type AdminArtworkUpsertInput = {
  title: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  artistId: string;
  categoryIds: string[];
  images: Array<{
    url: string;
    altText?: string;
    position: number;
  }>;
};
