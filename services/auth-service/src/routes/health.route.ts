import { Router } from 'express';

export function createHealthRouter(serviceName: string): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: serviceName,
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
