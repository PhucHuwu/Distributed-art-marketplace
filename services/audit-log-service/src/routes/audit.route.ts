import { Router } from 'express';
import { getAuditLogByEventId, getAuditLogs } from '../services/audit-log.service';

export function createAuditRouter(): Router {
  const router = Router();

  router.get('/admin/audit-logs', async (req, res, next) => {
    try {
      const result = await getAuditLogs({
        userId: req.query.userId as string | undefined,
        orderId: req.query.orderId as string | undefined,
        service: req.query.service as string | undefined,
        eventType: req.query.eventType as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        limit: req.query.limit as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/audit-logs/:eventId', async (req, res, next) => {
    try {
      const event = await getAuditLogByEventId(req.params.eventId);
      if (!event) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit event not found',
            details: [],
          },
        });
        return;
      }

      res.status(200).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
