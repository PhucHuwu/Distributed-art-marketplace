import { PaymentStatus } from '@prisma/client';

export type CreatePaymentInput = {
  orderId: string;
  userId: string | null;
  amount: number;
  currency: string;
  provider: string;
  correlationId: string;
};

export type ProcessPaymentInput = {
  paymentId: string;
  result: 'SUCCESS' | 'FAILED';
  correlationId: string;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
};

export type PaymentStatusTransition = {
  from: PaymentStatus | null;
  to: PaymentStatus;
  reason?: string;
};
