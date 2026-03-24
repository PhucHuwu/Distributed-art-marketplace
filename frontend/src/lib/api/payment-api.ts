import { request } from '@/lib/http-client';
import { Payment, PaymentDetail } from '@/types/payment';

export async function createPayment(
  token: string,
  payload: {
    orderId: string;
    userId?: string;
    amount: number;
    currency: string;
    provider: string;
    processingResult?: 'SUCCESS' | 'FAILED';
  },
) {
  return request<Payment>('/payments', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getPayment(token: string, paymentId: string) {
  return request<PaymentDetail>(`/payments/${paymentId}`, {
    token,
  });
}
