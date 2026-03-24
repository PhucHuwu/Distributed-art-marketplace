import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';

export type OrderWithItems = Order & {
  items: OrderItem[];
};

type OrderWithItemsPayload = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export type CreateOrderInput = {
  userId: string;
  shippingAddress: Record<string, unknown>;
};

function ensureObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

export function normalizeShippingAddress(value: unknown): Record<string, unknown> {
  return ensureObject(value, 'shippingAddress');
}

export async function createOrderFromCart(input: CreateOrderInput): Promise<OrderWithItems> {
  const shippingAddress = normalizeShippingAddress(input.shippingAddress);

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: {
        userId: input.userId,
        status: 'ACTIVE',
      },
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, 'EMPTY_CART', 'Cannot create order from an empty cart');
    }

    const totalAmount = cart.items.reduce(
      (acc, item) => acc.add(item.unitPrice.mul(item.qty)),
      new Prisma.Decimal(0),
    );

    const createdOrder: OrderWithItemsPayload = await tx.order.create({
      data: {
        userId: input.userId,
        status: OrderStatus.PENDING,
        totalAmount,
        currency: 'VND',
        shippingAddressSnapshot: shippingAddress as Prisma.InputJsonValue,
        items: {
          create: cart.items.map((item) => ({
            artworkId: item.artworkId,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
        },
        histories: {
          create: {
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            reason: 'Order created',
          },
        },
      },
      include: {
        items: true,
      },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: 'CHECKED_OUT' },
    });

    return createdOrder;
  });

  return order;
}

export async function getOrderByIdForUser(userId: string, orderId: string): Promise<OrderWithItems> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new HttpError(404, 'NOT_FOUND', 'Order not found');
  }

  return order;
}

export async function getOrdersForUser(userId: string): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}
