import { Router } from 'express';
import { PaymentPublisher } from '../broker/publisher';
import { createAndProcessPayment, getPaymentById } from '../services/payment.service';
import { HttpError } from '../utils/http-error';
import { RequestWithCorrelationId } from '../types/http';

export function createPaymentRouter(publisher: PaymentPublisher): Router {
  const router = Router();

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

      const correlationId = req.headers['x-correlation-id'];
      if (!correlationId) {
        throw new HttpError(500, 'INTERNAL_ERROR', 'Missing correlation id context');
      }

      const payment = await createAndProcessPayment(
        {
          orderId: body.orderId,
          userId: typeof body.userId === 'string' ? body.userId : null,
          amount: body.amount,
          currency: body.currency,
          provider: body.provider,
          correlationId,
        },
        publisher,
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
