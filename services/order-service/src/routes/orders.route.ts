import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { logger } from '../lib/logger';
import { addCartItem, getOrCreateActiveCart, removeCartItem, updateCartItem } from '../services/cart.service';
import {
  createOrderFromCart,
  getOrderByIdForUser,
  getOrdersForUser,
  normalizeShippingAddress,
} from '../services/order.service';
import { EventEnvelopeV1 } from '../types/event';
import { ensureCorrelationId } from '../utils/correlation-id';
import { createEventEnvelope } from '../utils/event-envelope';
import { HttpError } from '../utils/http-error';

type CartViewModel = {
  id: string;
  userId: string;
  status: string;
  items: Array<{
    id: string;
    artworkId: string;
    qty: number;
    unitPrice: unknown;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

type OrderViewModel = {
  id: string;
  userId: string;
  status: string;
  totalAmount: unknown;
  currency: string;
  shippingAddressSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    artworkId: string;
    qty: number;
    unitPrice: unknown;
  }>;
};

type RouteDeps = {
  getOrCreateActiveCart: (userId: string) => Promise<CartViewModel>;
  addCartItem: (input: {
    userId: string;
    artworkId: string;
    quantity: number;
    unitPrice: number | string;
  }) => Promise<CartViewModel>;
  updateCartItem: (input: { userId: string; itemId: string; quantity: number }) => Promise<CartViewModel>;
  removeCartItem: (input: { userId: string; itemId: string }) => Promise<CartViewModel>;
  createOrderFromCart: (input: {
    userId: string;
    shippingAddress: Record<string, unknown>;
  }) => Promise<OrderViewModel>;
  getOrderByIdForUser: (userId: string, orderId: string) => Promise<OrderViewModel>;
  getOrdersForUser: (userId: string) => Promise<OrderViewModel[]>;
};

function decimalToString(value: unknown): unknown {
  if (typeof value === 'object' && value && 'toString' in value) {
    const fn = (value as { toString: () => string }).toString;
    return fn.call(value);
  }
  return value;
}

function mapCart(cart: CartViewModel) {
  return {
    id: cart.id,
    userId: cart.userId,
    status: cart.status,
    items: cart.items.map((item) => ({
      id: item.id,
      artworkId: item.artworkId,
      quantity: item.qty,
      unitPrice: decimalToString(item.unitPrice),
    })),
    updatedAt: cart.updatedAt,
    createdAt: cart.createdAt,
  };
}

function mapOrder(order: OrderViewModel) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    totalAmount: decimalToString(order.totalAmount),
    currency: order.currency,
    shippingAddress: order.shippingAddressSnapshot,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      artworkId: item.artworkId,
      quantity: item.qty,
      unitPrice: decimalToString(item.unitPrice),
    })),
  };
}

export function createOrderRouter(config: {
  jwtSecret: string;
  serviceName: string;
  publishEvent: (routingKey: string, event: EventEnvelopeV1) => Promise<void>;
  deps?: Partial<RouteDeps>;
}): Router {
  const router = Router();
  const deps: RouteDeps = {
    getOrCreateActiveCart: config.deps?.getOrCreateActiveCart || getOrCreateActiveCart,
    addCartItem: config.deps?.addCartItem || addCartItem,
    updateCartItem: config.deps?.updateCartItem || updateCartItem,
    removeCartItem: config.deps?.removeCartItem || removeCartItem,
    createOrderFromCart: config.deps?.createOrderFromCart || createOrderFromCart,
    getOrderByIdForUser: config.deps?.getOrderByIdForUser || getOrderByIdForUser,
    getOrdersForUser: config.deps?.getOrdersForUser || getOrdersForUser,
  };

  router.use(auth(config.jwtSecret));

  router.get('/orders/cart', async (req, res, next) => {
    try {
      const cart = await deps.getOrCreateActiveCart(String(req.auth?.userId));
      res.status(200).json({ success: true, data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/orders/cart/items', async (req, res, next) => {
    try {
      const { artworkId, quantity, unitPrice } = req.body as {
        artworkId?: string;
        quantity?: number;
        unitPrice?: number | string;
      };

      if (!artworkId || quantity === undefined || unitPrice === undefined) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'artworkId, quantity, and unitPrice are required');
      }

      const cart = await deps.addCartItem({
        userId: String(req.auth?.userId),
        artworkId,
        quantity: Number(quantity),
        unitPrice,
      });

      res.status(201).json({ success: true, data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  });

  router.put('/orders/cart/items/:id', async (req, res, next) => {
    try {
      const { quantity } = req.body as { quantity?: number };
      if (quantity === undefined) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'quantity is required');
      }

      const cart = await deps.updateCartItem({
        userId: String(req.auth?.userId),
        itemId: req.params.id,
        quantity: Number(quantity),
      });

      res.status(200).json({ success: true, data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/orders/cart/items/:id', async (req, res, next) => {
    try {
      const cart = await deps.removeCartItem({
        userId: String(req.auth?.userId),
        itemId: req.params.id,
      });

      res.status(200).json({ success: true, data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/orders', async (req, res, next) => {
    try {
      const correlationId = ensureCorrelationId(req.headers['x-correlation-id']);
      const shippingAddress = normalizeShippingAddress((req.body as { shippingAddress?: unknown }).shippingAddress);
      const order = await deps.createOrderFromCart({
        userId: String(req.auth?.userId),
        shippingAddress,
      });

      const event = createEventEnvelope({
        eventType: 'order.created',
        correlationId,
        producer: config.serviceName,
        payload: {
          orderId: order.id,
          userId: order.userId,
          items: order.items.map((item) => ({
            artworkId: item.artworkId,
            quantity: item.qty,
            unitPrice: decimalToString(item.unitPrice),
          })),
          totalAmount: decimalToString(order.totalAmount),
          currency: order.currency,
          shippingAddress,
        },
      });

      await config.publishEvent('order.created', event);

      logger.info(
        {
          correlationId,
          eventId: event.eventId,
          orderId: order.id,
          userId: order.userId,
        },
        'Order created and event published',
      );

      res.status(201).json({ success: true, data: mapOrder(order) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/me', async (req, res, next) => {
    try {
      const orders = await deps.getOrdersForUser(String(req.auth?.userId));
      res.status(200).json({
        success: true,
        data: orders.map((order) => mapOrder(order)),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:orderId', async (req, res, next) => {
    try {
      const order = await deps.getOrderByIdForUser(String(req.auth?.userId), req.params.orderId);
      res.status(200).json({ success: true, data: mapOrder(order) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
