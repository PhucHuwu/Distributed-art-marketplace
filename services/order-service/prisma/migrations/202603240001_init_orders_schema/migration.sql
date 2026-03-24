-- Create enums
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Create carts table
CREATE TABLE "carts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- Create cart_items table
CREATE TABLE "cart_items" (
  "id" UUID NOT NULL,
  "cart_id" UUID NOT NULL,
  "artwork_id" UUID NOT NULL,
  "qty" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- Create orders table
CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "total_amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "shipping_address_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Create order_items table
CREATE TABLE "order_items" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "artwork_id" UUID NOT NULL,
  "qty" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Create order_status_histories table
CREATE TABLE "order_status_histories" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "from_status" "OrderStatus",
  "to_status" "OrderStatus" NOT NULL,
  "reason" TEXT NOT NULL,
  "event_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- Create processed_events table
CREATE TABLE "processed_events" (
  "id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "idx_carts_user_status" ON "carts"("user_id", "status");
CREATE UNIQUE INDEX "uq_cart_items_cart_artwork" ON "cart_items"("cart_id", "artwork_id");
CREATE INDEX "idx_cart_items_cart_id" ON "cart_items"("cart_id");
CREATE INDEX "idx_orders_user_created_at" ON "orders"("user_id", "created_at");
CREATE INDEX "idx_orders_status" ON "orders"("status");
CREATE INDEX "idx_order_items_order_id" ON "order_items"("order_id");
CREATE INDEX "idx_order_histories_order_created" ON "order_status_histories"("order_id", "created_at");
CREATE INDEX "idx_order_histories_event_id" ON "order_status_histories"("event_id");
CREATE UNIQUE INDEX "processed_events_event_id_key" ON "processed_events"("event_id");
CREATE INDEX "idx_processed_events_event_type" ON "processed_events"("event_type");

-- Add foreign keys
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_cart_id_fkey"
  FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_status_histories"
  ADD CONSTRAINT "order_status_histories_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
