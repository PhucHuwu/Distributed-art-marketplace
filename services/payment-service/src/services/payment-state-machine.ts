import { PaymentStatus } from '@prisma/client';
import { HttpError } from '../utils/http-error';

const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  INITIATED: [PaymentStatus.PROCESSING],
  PROCESSING: [PaymentStatus.SUCCESS, PaymentStatus.FAILED],
  SUCCESS: [],
  FAILED: [],
};

export function assertValidTransition(from: PaymentStatus, to: PaymentStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new HttpError(
      409,
      'INVALID_PAYMENT_STATUS_TRANSITION',
      `Invalid payment status transition from ${from} to ${to}`,
    );
  }
}
