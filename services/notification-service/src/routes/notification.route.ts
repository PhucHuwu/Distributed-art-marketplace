import { Router } from 'express';
import { NotificationConsumer } from '../types/consumer';
import { EventEnvelopeV1 } from '../types/event';
import { HttpError } from '../utils/http-error';
import { RequestWithCorrelationId } from '../types/http';

export function createNotificationRouter(consumer: NotificationConsumer): Router {
  const router = Router();

  router.get('/notifications/stats', (_req, res) => {
    res.status(200).json({
      success: true,
      data: consumer.getStats(),
    });
  });

  router.post('/notifications/debug/emit', async (req: RequestWithCorrelationId, res, next) => {
    try {
      const envelope = req.body as EventEnvelopeV1;
      if (!envelope || typeof envelope !== 'object') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid event payload');
      }

      if (!envelope.correlationId && req.headers['x-correlation-id']) {
        envelope.correlationId = req.headers['x-correlation-id'];
      }

      const result = await consumer.processEnvelope(envelope);

      res.status(202).json({
        success: true,
        data: {
          duplicated: result.duplicated,
          sentCount: result.sentCount,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
