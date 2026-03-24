import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './constants/openapi';
import { adminAuth } from './middlewares/admin-auth';
import { errorHandler } from './middlewares/error-handler';
import { requestContext } from './middlewares/request-context';
import { createCatalogRouter } from './routes/catalog.route';
import { createHealthRouter } from './routes/health.route';

export function createApp(jwtSecret: string, serviceName: string) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);

  app.use(createHealthRouter(serviceName));

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(adminAuth(jwtSecret));
  app.use(createCatalogRouter());

  app.use(errorHandler);

  return app;
}
