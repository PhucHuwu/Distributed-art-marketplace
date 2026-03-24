import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { authRouter } from './modules/auth/auth.routes';
import { errorHandler, notFoundHandler } from './shared/error-handler';
import { httpLoggerMiddleware } from './shared/http-logger';
import { requestContextMiddleware } from './shared/request-context';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use(httpLoggerMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/auth', authRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
