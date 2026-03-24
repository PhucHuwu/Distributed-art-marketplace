CREATE TYPE "StockReservationStatus" AS ENUM ('RESERVED', 'RELEASED', 'CANCELLED');

CREATE TABLE "stock_items" (
  "id" UUID NOT NULL,
  "artwork_id" TEXT NOT NULL,
  "on_hand_qty" INTEGER NOT NULL DEFAULT 0,
  "reserved_qty" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_items_artwork_id_key" ON "stock_items"("artwork_id");
CREATE INDEX "idx_stock_items_artwork_id" ON "stock_items"("artwork_id");

CREATE TABLE "stock_reservations" (
  "id" UUID NOT NULL,
  "reservation_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "artwork_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "StockReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "released_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "stock_item_id" UUID NOT NULL,
  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uk_stock_reservation_artwork" ON "stock_reservations"("reservation_id", "artwork_id");
CREATE INDEX "idx_stock_reservations_order_id" ON "stock_reservations"("order_id");
CREATE INDEX "idx_stock_reservations_artwork_id" ON "stock_reservations"("artwork_id");
CREATE INDEX "idx_stock_reservations_status" ON "stock_reservations"("status");

CREATE TABLE "processed_events" (
  "id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processed_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_events_event_id_key" ON "processed_events"("event_id");
CREATE INDEX "idx_processed_events_event_type" ON "processed_events"("event_type");

ALTER TABLE "stock_reservations"
ADD CONSTRAINT "stock_reservations_stock_item_id_fkey"
FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
