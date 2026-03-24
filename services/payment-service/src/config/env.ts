const requiredKeys = [
  'SERVICE_PORT',
  'DB_URL',
  'RABBITMQ_URL',
  'JWT_SECRET',
  'SERVICE_NAME',
  'RABBITMQ_EXCHANGE',
] as const;

export type EnvConfig = {
  servicePort: number;
  dbUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  serviceName: string;
  rabbitmqExchange: string;
  maxPublishRetry: number;
  publishRetryDelayMs: number;
};

export function getEnvConfig(): EnvConfig {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    servicePort: Number(process.env.SERVICE_PORT),
    dbUrl: String(process.env.DB_URL),
    rabbitmqUrl: String(process.env.RABBITMQ_URL),
    jwtSecret: String(process.env.JWT_SECRET),
    serviceName: String(process.env.SERVICE_NAME),
    rabbitmqExchange: String(process.env.RABBITMQ_EXCHANGE),
    maxPublishRetry: Number(process.env.RABBITMQ_MAX_PUBLISH_RETRY || 4),
    publishRetryDelayMs: Number(process.env.RABBITMQ_PUBLISH_RETRY_DELAY_MS || 1000),
  };
}
