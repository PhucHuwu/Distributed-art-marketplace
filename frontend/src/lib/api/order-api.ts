import { request } from '@/lib/http-client';
import { Cart, Order } from '@/types/order';

export async function getCart(token: string) {
  return request<Cart>('/orders/cart', { token });
}

export async function addCartItem(
  token: string,
  payload: { artworkId: string; quantity: number; unitPrice: number },
) {
  return request<Cart>('/orders/cart/items', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateCartItem(token: string, itemId: string, quantity: number) {
  return request<Cart>(`/orders/cart/items/${itemId}`, {
    method: 'PUT',
    token,
    body: { quantity },
  });
}

export async function removeCartItem(token: string, itemId: string) {
  return request<Cart>(`/orders/cart/items/${itemId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createOrder(token: string, shippingAddress: Record<string, unknown>) {
  return request<Order>('/orders', {
    method: 'POST',
    token,
    body: { shippingAddress },
  });
}

export async function listMyOrders(token: string) {
  return request<Order[]>('/orders/me', { token });
}

export async function getOrder(token: string, orderId: string) {
  return request<Order>(`/orders/${orderId}`, { token });
}
