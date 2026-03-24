import { Cart, CartItem, CartStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';

export type CartWithItems = Cart & {
  items: CartItem[];
};

function toDecimal(input: string | number): Prisma.Decimal {
  return new Prisma.Decimal(input);
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a positive integer`);
  }
}

export async function getOrCreateActiveCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findFirst({
    where: {
      userId,
      status: CartStatus.ACTIVE,
    },
    include: { items: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.cart.create({
    data: {
      userId,
      status: CartStatus.ACTIVE,
    },
    include: { items: true },
  });
}

export async function addCartItem(input: {
  userId: string;
  artworkId: string;
  quantity: number;
  unitPrice: string | number;
}): Promise<CartWithItems> {
  assertPositiveInteger(input.quantity, 'quantity');

  const price = toDecimal(input.unitPrice);
  if (price.lte(0)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'unitPrice must be greater than zero');
  }

  await prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findFirst({
      where: {
        userId: input.userId,
        status: CartStatus.ACTIVE,
      },
    });

    if (!cart) {
      cart = await tx.cart.create({
        data: {
          userId: input.userId,
          status: CartStatus.ACTIVE,
        },
      });
    }

    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_artworkId: {
          cartId: cart.id,
          artworkId: input.artworkId,
        },
      },
    });

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: {
          qty: existing.qty + input.quantity,
          unitPrice: price,
        },
      });
      return;
    }

    await tx.cartItem.create({
      data: {
        cartId: cart.id,
        artworkId: input.artworkId,
        qty: input.quantity,
        unitPrice: price,
      },
    });
  });

  return getOrCreateActiveCart(input.userId);
}

export async function updateCartItem(input: {
  userId: string;
  itemId: string;
  quantity: number;
}): Promise<CartWithItems> {
  assertPositiveInteger(input.quantity, 'quantity');

  const item = await prisma.cartItem.findUnique({
    where: { id: input.itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== input.userId || item.cart.status !== CartStatus.ACTIVE) {
    throw new HttpError(404, 'NOT_FOUND', 'Cart item not found');
  }

  await prisma.cartItem.update({
    where: { id: input.itemId },
    data: { qty: input.quantity },
  });

  return getOrCreateActiveCart(input.userId);
}

export async function removeCartItem(input: { userId: string; itemId: string }): Promise<CartWithItems> {
  const item = await prisma.cartItem.findUnique({
    where: { id: input.itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== input.userId || item.cart.status !== CartStatus.ACTIVE) {
    throw new HttpError(404, 'NOT_FOUND', 'Cart item not found');
  }

  await prisma.cartItem.delete({ where: { id: input.itemId } });
  return getOrCreateActiveCart(input.userId);
}
