export type PaymentStatus = 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type Payment = {
  id: string;
  orderId: string;
  userId: string | null;
  amount: string;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
};

export type PaymentDetail = {
  payment: Payment;
  history: Array<{
    id: string;
    fromStatus: PaymentStatus | null;
    toStatus: PaymentStatus;
    reason: string;
    correlationId: string;
    createdAt: string;
  }>;
};
