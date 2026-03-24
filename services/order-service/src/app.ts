import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './constants/openapi';
import { errorHandler } from './middlewares/error-handler';
import { requestContext } from './middlewares/request-context';
import { createHealthRouter } from './routes/health.route';
import { createOrderRouter } from './routes/orders.route';
import { EventEnvelopeV1 } from './types/event';

export function createApp(config: {
  jwtSecret: string;
  serviceName: string;
  publishEvent: (routingKey: string, event: EventEnvelopeV1) => Promise<void>;
}) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);

  app.use(createHealthRouter(config.serviceName));

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(
    createOrderRouter({
      jwtSecret: config.jwtSecret,
      serviceName: config.serviceName,
      publishEvent: config.publishEvent,
    }),
  );

  app.use(errorHandler);

  return app;
}
