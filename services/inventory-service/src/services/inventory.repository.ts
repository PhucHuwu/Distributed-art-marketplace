import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AdjustRequest, ReleaseRequest, ReserveRequest } from '../types/inventory';
import { HttpError } from '../utils/http-error';

type TxClient = Prisma.TransactionClient;

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required`);
  }
  return value.trim();
}

function assertPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a positive integer`);
  }
  return parsed;
}

function validateReserveRequest(payload: unknown): ReserveRequest {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Body must be an object');
  }

  const body = payload as Record<string, unknown>;
  const reservationId = assertString(body.reservationId, 'reservationId');
  const orderId = assertString(body.orderId, 'orderId');

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'items must be a non-empty array');
  }

  const items = body.items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new HttpError(400, 'VALIDATION_ERROR', `items[${index}] must be an object`);
    }

    const record = item as Record<string, unknown>;
    return {
      artworkId: assertString(record.artworkId, `items[${index}].artworkId`),
      quantity: assertPositiveInt(record.quantity, `items[${index}].quantity`),
    };
  });

  return { reservationId, orderId, items };
}

function validateReleaseRequest(payload: unknown): ReleaseRequest {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Body must be an object');
  }

  const body = payload as Record<string, unknown>;
  return {
    reservationId: assertString(body.reservationId, 'reservationId'),
  };
}

function validateAdjustRequest(payload: unknown): AdjustRequest {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Body must be an object');
  }

  const body = payload as Record<string, unknown>;
  const deltaQty = Number(body.deltaQty);

  if (!Number.isInteger(deltaQty) || deltaQty === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'deltaQty must be a non-zero integer');
  }

  return {
    artworkId: assertString(body.artworkId, 'artworkId'),
    deltaQty,
    reason: typeof body.reason === 'string' ? body.reason.trim() : undefined,
  };
}

async function getOrCreateStockItem(tx: TxClient, artworkId: string) {
  const item = await tx.stockItem.upsert({
    where: { artworkId },
    update: {},
    create: {
      artworkId,
      onHandQty: 0,
      reservedQty: 0,
    },
  });

  return tx.stockItem.findUniqueOrThrow({
    where: { id: item.id },
  });
}

async function incrementReservedQtySafely(tx: TxClient, artworkId: string, quantity: number): Promise<boolean> {
  const affectedRows = await tx.$executeRaw(
    Prisma.sql`
      UPDATE stock_items
      SET reserved_qty = reserved_qty + ${quantity}, updated_at = NOW()
      WHERE artwork_id = ${artworkId}
        AND (on_hand_qty - reserved_qty) >= ${quantity}
    `,
  );

  return Number(affectedRows) > 0;
}

export async function getStockByArtworkId(artworkId: string) {
  const normalizedId = assertString(artworkId, 'artworkId');
  const stock = await prisma.stockItem.findUnique({
    where: { artworkId: normalizedId },
    select: {
      artworkId: true,
      onHandQty: true,
      reservedQty: true,
      updatedAt: true,
    },
  });

  if (!stock) {
    return {
      artworkId: normalizedId,
      onHandQty: 0,
      reservedQty: 0,
      availableQty: 0,
      updatedAt: null,
    };
  }

  return {
    artworkId: stock.artworkId,
    onHandQty: stock.onHandQty,
    reservedQty: stock.reservedQty,
    availableQty: stock.onHandQty - stock.reservedQty,
    updatedAt: stock.updatedAt.toISOString(),
  };
}

export async function adjustStock(payload: unknown) {
  const request = validateAdjustRequest(payload);

  return prisma.$transaction(async (tx) => {
    const locked = await getOrCreateStockItem(tx, request.artworkId);

    const nextOnHand = locked.onHandQty + request.deltaQty;
    if (nextOnHand < 0) {
      throw new HttpError(409, 'STOCK_CONSTRAINT_VIOLATION', 'onHandQty cannot be negative');
    }

    if (nextOnHand - locked.reservedQty < 0) {
      throw new HttpError(
        409,
        'STOCK_CONSTRAINT_VIOLATION',
        'on_hand_qty - reserved_qty must remain greater than or equal to 0',
      );
    }

    const updated = await tx.stockItem.update({
      where: { id: locked.id },
      data: { onHandQty: nextOnHand },
      select: {
        artworkId: true,
        onHandQty: true,
        reservedQty: true,
        updatedAt: true,
      },
    });

    logger.info(
      {
        artworkId: updated.artworkId,
        deltaQty: request.deltaQty,
        reason: request.reason || null,
      },
      'Stock adjusted',
    );

    return {
      artworkId: updated.artworkId,
      onHandQty: updated.onHandQty,
      reservedQty: updated.reservedQty,
      availableQty: updated.onHandQty - updated.reservedQty,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function reserveStock(payload: unknown) {
  const request = validateReserveRequest(payload);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.stockReservation.findMany({
      where: { reservationId: request.reservationId },
      include: { stockItem: true },
    });

    if (existing.length > 0) {
      const active = existing.filter((reservation) => reservation.status === 'RESERVED');
      if (active.length !== existing.length) {
        throw new HttpError(409, 'RESERVATION_STATE_ERROR', 'Reservation exists but is not active');
      }

      return {
        reservationId: request.reservationId,
        orderId: existing[0].orderId,
        status: 'RESERVED',
      };
    }

    for (const item of request.items) {
      const stockItem = await getOrCreateStockItem(tx, item.artworkId);
      const incremented = await incrementReservedQtySafely(tx, item.artworkId, item.quantity);
      if (!incremented) {
        const current = await tx.stockItem.findUnique({
          where: { id: stockItem.id },
          select: { onHandQty: true, reservedQty: true },
        });

        const availableQty = current ? current.onHandQty - current.reservedQty : 0;
        throw new HttpError(409, 'INSUFFICIENT_STOCK', `Insufficient stock for artwork ${item.artworkId}`, [
          {
            artworkId: item.artworkId,
            requestedQty: item.quantity,
            availableQty,
          },
        ]);
      }

      await tx.stockReservation.create({
        data: {
          reservationId: request.reservationId,
          orderId: request.orderId,
          artworkId: item.artworkId,
          quantity: item.quantity,
          status: 'RESERVED',
          stockItemId: stockItem.id,
        },
      });
    }

    return {
      reservationId: request.reservationId,
      orderId: request.orderId,
      status: 'RESERVED',
    };
  });
}

export async function releaseStock(payload: unknown) {
  const request = validateReleaseRequest(payload);

  return prisma.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: { reservationId: request.reservationId },
      include: { stockItem: true },
    });

    if (reservations.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'Reservation not found');
    }

    const active = reservations.filter((reservation) => reservation.status === 'RESERVED');
    if (active.length === 0) {
      return {
        reservationId: request.reservationId,
        status: 'RELEASED',
      };
    }

    for (const reservation of active) {
      const nextReservedQty = reservation.stockItem.reservedQty - reservation.quantity;
      await tx.stockItem.update({
        where: { id: reservation.stockItemId },
        data: {
          reservedQty: nextReservedQty < 0 ? 0 : nextReservedQty,
        },
      });

      await tx.stockReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });
    }

    return {
      reservationId: request.reservationId,
      status: 'RELEASED',
    };
  });
}

export async function markEventProcessed(eventId: string, eventType: string, correlationId: string): Promise<boolean> {
  try {
    await prisma.processedEvent.create({
      data: {
        eventId,
        eventType,
        correlationId,
      },
    });
    return true;
  } catch (error) {
    const known = error as Prisma.PrismaClientKnownRequestError;
    if (known.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const found = await prisma.processedEvent.findUnique({
    where: { eventId },
    select: { id: true },
  });

  return Boolean(found);
}
