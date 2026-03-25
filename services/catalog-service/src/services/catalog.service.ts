import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ArtworkListQuery, AdminArtworkUpsertInput } from '../types/catalog';
import { HttpError } from '../utils/http-error';

type Pagination = {
  page: number;
  limit: number;
};

type ArtworkWhere = Prisma.ArtworkWhereInput;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parsePositiveInt(value: string | undefined, defaultValue: number, maxValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return Math.min(parsed, maxValue);
}

function parsePagination(query: ArtworkListQuery): Pagination {
  return {
    page: parsePositiveInt(query.page, 1, 100000),
    limit: parsePositiveInt(query.limit, 20, 100),
  };
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Price filter must be a non-negative number');
  }

  return parsed;
}

function buildArtworkWhere(query: ArtworkListQuery): ArtworkWhere {
  const minPrice = parsePrice(query.minPrice);
  const maxPrice = parsePrice(query.maxPrice);

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'minPrice must be less than or equal to maxPrice');
  }

  const where: ArtworkWhere = {};

  if (query.artist) {
    where.artist = {
      OR: [
        { id: query.artist },
        { slug: query.artist },
        { name: { equals: query.artist, mode: 'insensitive' } },
      ],
    };
  }

  if (query.category) {
    where.categories = {
      some: {
        category: {
          OR: [
            { id: query.category },
            { slug: query.category },
            { name: { equals: query.category, mode: 'insensitive' } },
          ],
        },
      },
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      gte: minPrice,
      lte: maxPrice,
    };
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { slug: { contains: query.q, mode: 'insensitive' } },
      { artist: { name: { contains: query.q, mode: 'insensitive' } } },
    ];
  }

  return where;
}

function toArtworkItem(record: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: Prisma.Decimal;
  currency: string;
  artist: { id: string; slug: string; name: string };
  categories: Array<{ category: { id: string; slug: string; name: string } }>;
  images: Array<{ imageUrl: string; altText: string | null; position: number }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description,
    price: Number(record.price),
    currency: record.currency,
    artist: record.artist,
    categories: record.categories.map((item) => item.category),
    images: record.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        url: image.imageUrl,
        altText: image.altText,
        position: image.position,
      })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listArtworks(query: ArtworkListQuery) {
  const { page, limit } = parsePagination(query);
  const where = buildArtworkWhere(query);

  const [total, items] = await prisma.$transaction([
    prisma.artwork.count({ where }),
    prisma.artwork.findMany({
      where,
      include: {
        artist: { select: { id: true, slug: true, name: true } },
        categories: { include: { category: { select: { id: true, slug: true, name: true } } } },
        images: { select: { imageUrl: true, altText: true, position: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: items.map((item) => toArtworkItem(item)),
    meta: {
      page,
      limit,
      total,
      totalPages,
      filters: {
        artist: query.artist || null,
        category: query.category || null,
        minPrice: query.minPrice ? Number(query.minPrice) : null,
        maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
        q: query.q || null,
      },
    },
  };
}

export async function getArtworkByIdOrSlug(idOrSlug: string) {
  const where: Prisma.ArtworkWhereInput = isUuid(idOrSlug)
    ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };

  const artwork = await prisma.artwork.findFirst({
    where,
    include: {
      artist: { select: { id: true, slug: true, name: true } },
      categories: { include: { category: { select: { id: true, slug: true, name: true } } } },
      images: { select: { imageUrl: true, altText: true, position: true } },
    },
  });

  if (!artwork) {
    return null;
  }

  return toArtworkItem(artwork);
}

export async function listArtists() {
  const artists = await prisma.artist.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      _count: {
        select: { artworks: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return artists.map((artist) => ({
    id: artist.id,
    slug: artist.slug,
    name: artist.name,
    bio: artist.bio,
    artworkCount: artist._count.artworks,
  }));
}

function validateAdminNamedEntityPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body must be an object');
  }

  const body = payload as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;
  const bio = typeof body.bio === 'string' ? body.bio.trim() : undefined;

  if (!name || !slug) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'name and slug are required');
  }

  return { name, slug, description, bio };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  });

  return categories;
}

export async function createArtist(payload: unknown) {
  const data = validateAdminNamedEntityPayload(payload);

  try {
    return await prisma.artist.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
      },
    });
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Artist slug already exists');
    }
    throw error;
  }
}

export async function updateArtist(artistId: string, payload: unknown) {
  const data = validateAdminNamedEntityPayload(payload);
  const existing = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });

  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Artist not found');
  }

  try {
    return await prisma.artist.update({
      where: { id: artistId },
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
      },
    });
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Artist slug already exists');
    }
    throw error;
  }
}

export async function createCategory(payload: unknown) {
  const data = validateAdminNamedEntityPayload(payload);

  try {
    return await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Category slug already exists');
    }
    throw error;
  }
}

export async function updateCategory(categoryId: string, payload: unknown) {
  const data = validateAdminNamedEntityPayload(payload);
  const existing = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });

  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Category not found');
  }

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Category slug already exists');
    }
    throw error;
  }
}

function validateAdminArtworkPayload(payload: unknown): AdminArtworkUpsertInput {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request body must be an object');
  }

  const body = payload as Record<string, unknown>;

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;
  const currency = typeof body.currency === 'string' ? body.currency.trim() : 'VND';
  const artistId = typeof body.artistId === 'string' ? body.artistId.trim() : '';
  const price = Number(body.price);

  if (!title || !slug || !artistId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'title, slug, and artistId are required');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'price must be a non-negative number');
  }

  const categoryIds = Array.isArray(body.categoryIds)
    ? body.categoryIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  if (categoryIds.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'categoryIds must contain at least 1 category id');
  }

  const imagesInput = Array.isArray(body.images) ? body.images : [];
  if (imagesInput.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'images must contain at least 1 image');
  }

  const images = imagesInput.map((image, index) => {
    if (!image || typeof image !== 'object') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Each image must be an object');
    }

    const item = image as Record<string, unknown>;
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    const altText = typeof item.altText === 'string' ? item.altText.trim() : undefined;
    const position = Number.isInteger(item.position) ? Number(item.position) : index;

    if (!url) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Each image requires url');
    }

    return {
      url,
      altText,
      position,
    };
  });

  return {
    title,
    slug,
    description,
    price,
    currency,
    artistId,
    categoryIds,
    images,
  };
}

async function assertRelationsExist(artistId: string, categoryIds: string[]): Promise<void> {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });
  if (!artist) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'artistId does not exist');
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });

  if (categories.length !== new Set(categoryIds).size) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'One or more categoryIds do not exist');
  }
}

export async function createArtwork(payload: unknown) {
  const data = validateAdminArtworkPayload(payload);
  await assertRelationsExist(data.artistId, data.categoryIds);

  try {
    const created = await prisma.artwork.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        currency: data.currency,
        artistId: data.artistId,
        categories: {
          createMany: {
            data: Array.from(new Set(data.categoryIds)).map((categoryId) => ({ categoryId })),
          },
        },
        images: {
          createMany: {
            data: data.images.map((image) => ({
              imageUrl: image.url,
              altText: image.altText,
              position: image.position,
            })),
          },
        },
      },
      include: {
        artist: { select: { id: true, slug: true, name: true } },
        categories: { include: { category: { select: { id: true, slug: true, name: true } } } },
        images: { select: { imageUrl: true, altText: true, position: true } },
      },
    });

    return toArtworkItem(created);
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Artwork slug already exists');
    }
    throw error;
  }
}

export async function updateArtwork(artworkId: string, payload: unknown) {
  const data = validateAdminArtworkPayload(payload);
  await assertRelationsExist(data.artistId, data.categoryIds);

  const existing = await prisma.artwork.findUnique({ where: { id: artworkId }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Artwork not found');
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.artworkCategory.deleteMany({ where: { artworkId } });
      await tx.artworkImage.deleteMany({ where: { artworkId } });

      return tx.artwork.update({
        where: { id: artworkId },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          price: new Prisma.Decimal(data.price),
          currency: data.currency,
          artistId: data.artistId,
          categories: {
            createMany: {
              data: Array.from(new Set(data.categoryIds)).map((categoryId) => ({ categoryId })),
            },
          },
          images: {
            createMany: {
              data: data.images.map((image) => ({
                imageUrl: image.url,
                altText: image.altText,
                position: image.position,
              })),
            },
          },
        },
        include: {
          artist: { select: { id: true, slug: true, name: true } },
          categories: { include: { category: { select: { id: true, slug: true, name: true } } } },
          images: { select: { imageUrl: true, altText: true, position: true } },
        },
      });
    });

    return toArtworkItem(updated);
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      throw new HttpError(409, 'CONFLICT', 'Artwork slug already exists');
    }
    throw error;
  }
}
