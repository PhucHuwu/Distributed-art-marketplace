CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "full_name" TEXT,
  "phone_number" TEXT,
  "avatar_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_addresses" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "profile_id" UUID NOT NULL,
  "recipient" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "ward" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postal_code" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE INDEX "idx_user_addresses_user_id" ON "user_addresses"("user_id");
CREATE INDEX "idx_user_addresses_profile_id" ON "user_addresses"("profile_id");

ALTER TABLE "user_addresses"
ADD CONSTRAINT "user_addresses_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
