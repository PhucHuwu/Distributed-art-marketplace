import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './constants/openapi';
import { errorHandler } from './middlewares/error-handler';
import { requestContext } from './middlewares/request-context';
import { createAuthRouter } from './routes/auth.route';
import { createHealthRouter } from './routes/health.route';

export function createApp(config: {
  jwtSecret: string;
  serviceName: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
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
    createAuthRouter({
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn,
      bcryptRounds: config.bcryptRounds,
    }),
  );

  app.use(errorHandler);

  return app;
}
