import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: process.env.SERVICE_NAME || 'payment-service' },
  enabled: process.env.NODE_ENV !== 'test',
});
