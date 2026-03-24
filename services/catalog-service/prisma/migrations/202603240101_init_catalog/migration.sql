CREATE TABLE "artists" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bio" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

CREATE TABLE "artworks" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "artist_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "artworks_slug_key" ON "artworks"("slug");
CREATE INDEX "idx_artworks_artist_id" ON "artworks"("artist_id");
CREATE INDEX "idx_artworks_price" ON "artworks"("price");

CREATE TABLE "artwork_images" (
  "id" UUID NOT NULL,
  "artwork_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL,
  "alt_text" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artwork_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_artwork_images_artwork_id" ON "artwork_images"("artwork_id");

CREATE TABLE "categories" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE TABLE "artwork_categories" (
  "artwork_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artwork_categories_pkey" PRIMARY KEY ("artwork_id", "category_id")
);

CREATE INDEX "idx_artwork_categories_category_id" ON "artwork_categories"("category_id");

ALTER TABLE "artworks"
ADD CONSTRAINT "artworks_artist_id_fkey"
FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "artwork_images"
ADD CONSTRAINT "artwork_images_artwork_id_fkey"
FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "artwork_categories"
ADD CONSTRAINT "artwork_categories_artwork_id_fkey"
FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "artwork_categories"
ADD CONSTRAINT "artwork_categories_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
