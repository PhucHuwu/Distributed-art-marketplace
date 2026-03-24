import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreatePaymentInput, ProcessPaymentInput } from '../types/payment';
import { HttpError } from '../utils/http-error';
import { assertValidTransition } from './payment-state-machine';
import { PaymentPublisher } from '../broker/publisher';

type PaymentEventType = 'payment.success' | 'payment.failed';

type PaymentEventPayload = {
  paymentId: string;
  orderId: string;
  userId: string | null;
  amount: string;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  failureCode: string | null;
  failureMessage: string | null;
};

function sanitizeAmount(amount: number): Prisma.Decimal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'amount must be a positive number');
  }

  return new Prisma.Decimal(amount.toFixed(2));
}

function normalizeCurrency(currency: string): string {
  const value = currency.trim().toUpperCase();
  if (!value) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'currency is required');
  }

  return value;
}

function normalizeProvider(provider: string): string {
  const value = provider.trim();
  if (!value) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'provider is required');
  }

  return value;
}

function toEventPayload(input: {
  paymentId: string;
  orderId: string;
  userId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  failureCode: string | null;
  failureMessage: string | null;
}): PaymentEventPayload {
  return {
    paymentId: input.paymentId,
    orderId: input.orderId,
    userId: input.userId,
    amount: input.amount.toFixed(2),
    currency: input.currency,
    provider: input.provider,
    status: input.status,
    providerReference: input.providerReference,
    failureCode: input.failureCode,
    failureMessage: input.failureMessage,
  };
}

export async function createAndProcessPayment(
  input: CreatePaymentInput,
  publisher: PaymentPublisher,
  processingResult: 'SUCCESS' | 'FAILED',
  providerReference?: string,
  failureCode?: string,
  failureMessage?: string,
) {
  const orderId = input.orderId.trim();
  if (!orderId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'orderId is required');
  }

  const normalizedUserId = input.userId?.trim() || null;
  const amount = sanitizeAmount(input.amount);
  const currency = normalizeCurrency(input.currency);
  const provider = normalizeProvider(input.provider);

  const created = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        userId: normalizedUserId,
        amount,
        currency,
        provider,
        status: PaymentStatus.INITIATED,
        correlationId: input.correlationId,
      },
    });

    await tx.paymentStatusHistory.create({
      data: {
        paymentId: payment.id,
        fromStatus: null,
        toStatus: PaymentStatus.INITIATED,
        reason: 'Payment created',
        correlationId: input.correlationId,
      },
    });

    return payment;
  });

  const processed = await processPayment(
    {
      paymentId: created.id,
      result: processingResult,
      correlationId: input.correlationId,
      providerReference,
      failureCode,
      failureMessage,
    },
    publisher,
  );

  return processed;
}

export async function processPayment(input: ProcessPaymentInput, publisher: PaymentPublisher) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) {
      throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    assertValidTransition(payment.status, PaymentStatus.PROCESSING);

    const processing = await tx.payment.update({
      where: { id: input.paymentId },
      data: {
        status: PaymentStatus.PROCESSING,
      },
    });

    await tx.paymentStatusHistory.create({
      data: {
        paymentId: input.paymentId,
        fromStatus: payment.status,
        toStatus: PaymentStatus.PROCESSING,
        reason: 'Payment moved to processing',
        correlationId: input.correlationId,
      },
    });

    return processing;
  });

  const targetStatus = input.result === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
  const eventType: PaymentEventType = input.result === 'SUCCESS' ? 'payment.success' : 'payment.failed';

  const finalized = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) {
      throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    assertValidTransition(payment.status, targetStatus);

    const updated = await tx.payment.update({
      where: { id: input.paymentId },
      data: {
        status: targetStatus,
        processedAt: new Date(),
        providerReference: input.providerReference?.trim() || null,
        failureCode: targetStatus === PaymentStatus.FAILED ? input.failureCode?.trim() || null : null,
        failureMessage:
          targetStatus === PaymentStatus.FAILED ? input.failureMessage?.trim() || null : null,
      },
    });

    await tx.paymentStatusHistory.create({
      data: {
        paymentId: input.paymentId,
        fromStatus: payment.status,
        toStatus: targetStatus,
        reason: targetStatus === PaymentStatus.SUCCESS ? 'Payment completed' : 'Payment failed',
        correlationId: input.correlationId,
        metadata:
          targetStatus === PaymentStatus.FAILED
            ? {
                failureCode: input.failureCode?.trim() || null,
                failureMessage: input.failureMessage?.trim() || null,
              }
            : undefined,
      },
    });

    return updated;
  });

  await publisher.publishEvent({
    eventType,
    correlationId: input.correlationId,
    payload: toEventPayload({
      paymentId: finalized.id,
      orderId: finalized.orderId,
      userId: finalized.userId,
      amount: finalized.amount,
      currency: finalized.currency,
      provider: finalized.provider,
      status: finalized.status,
      providerReference: finalized.providerReference,
      failureCode: finalized.failureCode,
      failureMessage: finalized.failureMessage,
    }),
  });

  return finalized;
}

export async function getPaymentById(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      histories: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!payment) {
    throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
  }

  return payment;
}

export function __testOnly__assertTransition(from: PaymentStatus, to: PaymentStatus): void {
  assertValidTransition(from, to);
}

export function __testOnly__toEventPayload(input: {
  paymentId: string;
  orderId: string;
  userId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  provider: string;
  status: PaymentStatus;
  providerReference: string | null;
  failureCode: string | null;
  failureMessage: string | null;
}): PaymentEventPayload {
  return toEventPayload(input);
}

export function __testOnly__normalizeCurrency(currency: string): string {
  return normalizeCurrency(currency);
}

export function __testOnly__normalizeProvider(provider: string): string {
  return normalizeProvider(provider);
}

export function __testOnly__sanitizeAmount(amount: number): Prisma.Decimal {
  return sanitizeAmount(amount);
}
