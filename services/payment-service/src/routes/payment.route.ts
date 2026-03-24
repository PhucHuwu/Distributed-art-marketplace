import { Router } from 'express';
import { PaymentPublisher } from '../broker/publisher';
import { auth } from '../middlewares/auth';
import { createAndProcessPayment, getPaymentById } from '../services/payment.service';
import { HttpError } from '../utils/http-error';
import { RequestWithCorrelationId } from '../types/http';

export function createPaymentRouter(config: { publisher: PaymentPublisher; jwtSecret: string }): Router {
  const router = Router();
  router.use(auth(config.jwtSecret));

  router.post('/payments', async (req: RequestWithCorrelationId, res, next) => {
    try {
      const body = req.body as {
        orderId?: string;
        userId?: string;
        amount?: number;
        currency?: string;
        provider?: string;
        processingResult?: 'SUCCESS' | 'FAILED';
        providerReference?: string;
        failureCode?: string;
        failureMessage?: string;
      };

      if (!body.orderId || typeof body.orderId !== 'string') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'orderId is required');
      }

      if (typeof body.amount !== 'number') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'amount must be a number');
      }

      if (!body.currency || typeof body.currency !== 'string') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'currency is required');
      }

      if (!body.provider || typeof body.provider !== 'string') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'provider is required');
      }

      if (
        req.auth?.role !== 'ADMIN' &&
        typeof body.userId === 'string' &&
        body.userId.trim() !== req.auth?.userId
      ) {
        throw new HttpError(403, 'FORBIDDEN', 'Cannot create payment for another user');
      }

      const correlationId = req.headers['x-correlation-id'];
      if (!correlationId) {
        throw new HttpError(500, 'INTERNAL_ERROR', 'Missing correlation id context');
      }

      const effectiveUserId =
        req.auth?.role === 'ADMIN' && typeof body.userId === 'string'
          ? body.userId.trim() || null
          : req.auth?.userId || null;

      const payment = await createAndProcessPayment(
        {
          orderId: body.orderId,
          userId: effectiveUserId,
          amount: body.amount,
          currency: body.currency,
          provider: body.provider,
          correlationId,
        },
        config.publisher,
        body.processingResult || 'SUCCESS',
        body.providerReference,
        body.failureCode,
        body.failureMessage,
      );

      res.status(201).json({
        success: true,
        data: {
          id: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount.toFixed(2),
          currency: payment.currency,
          provider: payment.provider,
          status: payment.status,
          providerReference: payment.providerReference,
          failureCode: payment.failureCode,
          failureMessage: payment.failureMessage,
          correlationId: payment.correlationId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          processedAt: payment.processedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/payments/:id', async (req, res, next) => {
    try {
      const payment = await getPaymentById(req.params.id);

      if (req.auth?.role !== 'ADMIN' && payment.userId !== req.auth?.userId) {
        throw new HttpError(403, 'FORBIDDEN', 'Cannot access another user payment');
      }

      res.status(200).json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount.toFixed(2),
            currency: payment.currency,
            provider: payment.provider,
            status: payment.status,
            providerReference: payment.providerReference,
            failureCode: payment.failureCode,
            failureMessage: payment.failureMessage,
            correlationId: payment.correlationId,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            processedAt: payment.processedAt,
          },
          history: payment.histories,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/payments/webhook/:provider', (req: RequestWithCorrelationId, res) => {
    res.status(202).json({
      success: true,
      data: {
        accepted: true,
        provider: req.params.provider,
        message: 'Webhook stub received',
      },
      correlationId: req.headers['x-correlation-id'] || null,
    });
  });

  return router;
}
