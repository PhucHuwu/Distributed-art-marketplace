const requiredKeys = [
  'SERVICE_PORT',
  'DB_URL',
  'RABBITMQ_URL',
  'JWT_SECRET',
  'SERVICE_NAME',
  'RABBITMQ_EXCHANGE',
  'RABBITMQ_QUEUE',
] as const;

export type EnvConfig = {
  servicePort: number;
  dbUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  serviceName: string;
  rabbitmqExchange: string;
  rabbitmqQueue: string;
  rabbitmqRoutingKeys: string[];
  maxRetryCount: number;
  retryBackoffMs: number[];
  dlx: string;
  dlq: string;
};

function parseRetryBackoff(input: string): number[] {
  const values = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) {
    return [5000, 30000, 120000];
  }

  return values;
}

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
    rabbitmqQueue: String(process.env.RABBITMQ_QUEUE),
    rabbitmqRoutingKeys: (process.env.RABBITMQ_ROUTING_KEYS || 'order.completed,order.failed,payment.failed')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean),
    maxRetryCount: Number(process.env.RABBITMQ_MAX_RETRY || 4),
    retryBackoffMs: parseRetryBackoff(process.env.RABBITMQ_RETRY_BACKOFF_MS || '5000,30000,120000'),
    dlx: String(process.env.RABBITMQ_DLX || 'dam.dlx.v1'),
    dlq: String(process.env.RABBITMQ_DLQ || 'dam.notification-service.dlq.v1'),
  };
}
