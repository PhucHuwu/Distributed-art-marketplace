import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const [artistOne, artistTwo] = await Promise.all([
    prisma.artist.upsert({
      where: { slug: 'nguyen-thai-hoc' },
      update: {},
      create: {
        slug: 'nguyen-thai-hoc',
        name: 'Nguyen Thai Hoc',
        bio: 'Contemporary Vietnamese oil painter.',
      },
    }),
    prisma.artist.upsert({
      where: { slug: 'tran-lan-huong' },
      update: {},
      create: {
        slug: 'tran-lan-huong',
        name: 'Tran Lan Huong',
        bio: 'Urban and abstract visual storyteller.',
      },
    }),
  ]);

  const [categoryOne, categoryTwo, categoryThree] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'landscape' },
      update: {},
      create: { slug: 'landscape', name: 'Landscape', description: 'Nature and outdoor scenes' },
    }),
    prisma.category.upsert({
      where: { slug: 'abstract' },
      update: {},
      create: { slug: 'abstract', name: 'Abstract', description: 'Abstract composition artworks' },
    }),
    prisma.category.upsert({
      where: { slug: 'city-life' },
      update: {},
      create: { slug: 'city-life', name: 'City Life', description: 'Urban daily life artworks' },
    }),
  ]);

  const sampleArtworks = [
    {
      slug: 'misty-sapa-morning',
      title: 'Misty Sapa Morning',
      description: 'Soft morning fog over the mountain terraces.',
      price: 3200000,
      currency: 'VND',
      artistId: artistOne.id,
      categories: [categoryOne.id],
      images: [
        { imageUrl: 'https://images.example.local/sapa-1.jpg', altText: 'Misty Sapa Morning', position: 0 },
      ],
    },
    {
      slug: 'hanoi-night-rhythm',
      title: 'Hanoi Night Rhythm',
      description: 'Lively city street with warm neon reflections.',
      price: 4500000,
      currency: 'VND',
      artistId: artistTwo.id,
      categories: [categoryTwo.id, categoryThree.id],
      images: [
        { imageUrl: 'https://images.example.local/hanoi-1.jpg', altText: 'Hanoi Night Rhythm', position: 0 },
      ],
    },
  ];

  for (const artwork of sampleArtworks) {
    await prisma.artwork.upsert({
      where: { slug: artwork.slug },
      update: {
        title: artwork.title,
        description: artwork.description,
        price: artwork.price,
        currency: artwork.currency,
        artistId: artwork.artistId,
      },
      create: {
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        price: artwork.price,
        currency: artwork.currency,
        artistId: artwork.artistId,
      },
    });

    const created = await prisma.artwork.findUnique({ where: { slug: artwork.slug }, select: { id: true } });
    if (!created) {
      continue;
    }

    await prisma.artworkCategory.deleteMany({ where: { artworkId: created.id } });
    await prisma.artworkImage.deleteMany({ where: { artworkId: created.id } });

    await prisma.artworkCategory.createMany({
      data: artwork.categories.map((categoryId) => ({ artworkId: created.id, categoryId })),
      skipDuplicates: true,
    });

    await prisma.artworkImage.createMany({
      data: artwork.images.map((image) => ({
        artworkId: created.id,
        imageUrl: image.imageUrl,
        altText: image.altText,
        position: image.position,
      })),
      skipDuplicates: true,
    });
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Catalog seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
