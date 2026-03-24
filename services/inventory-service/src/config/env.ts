const requiredKeys = [
  'SERVICE_PORT',
  'DB_URL',
  'RABBITMQ_URL',
  'JWT_SECRET',
  'SERVICE_NAME',
  'RABBITMQ_EXCHANGE',
  'RABBITMQ_QUEUE',
  'RABBITMQ_RETRY_QUEUE',
  'RABBITMQ_DLQ_QUEUE',
  'RABBITMQ_DLX',
] as const;

export type EnvConfig = {
  servicePort: number;
  dbUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  serviceName: string;
  rabbitmqExchange: string;
  rabbitmqQueue: string;
  rabbitmqRetryQueue: string;
  rabbitmqDlqQueue: string;
  rabbitmqDlx: string;
  consumeRoutingKeys: string[];
  retryDelaysMs: number[];
};

function parseNumberList(value: string | undefined, fallback: number[]): number[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

  return parsed.length > 0 ? parsed : fallback;
}

export function getEnvConfig(): EnvConfig {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const servicePort = Number(process.env.SERVICE_PORT);
  if (!Number.isFinite(servicePort) || servicePort <= 0) {
    throw new Error('SERVICE_PORT must be a positive number');
  }

  return {
    servicePort,
    dbUrl: String(process.env.DB_URL),
    rabbitmqUrl: String(process.env.RABBITMQ_URL),
    jwtSecret: String(process.env.JWT_SECRET),
    serviceName: String(process.env.SERVICE_NAME),
    rabbitmqExchange: String(process.env.RABBITMQ_EXCHANGE),
    rabbitmqQueue: String(process.env.RABBITMQ_QUEUE),
    rabbitmqRetryQueue: String(process.env.RABBITMQ_RETRY_QUEUE),
    rabbitmqDlqQueue: String(process.env.RABBITMQ_DLQ_QUEUE),
    rabbitmqDlx: String(process.env.RABBITMQ_DLX),
    consumeRoutingKeys: (process.env.RABBITMQ_CONSUME_ROUTING_KEYS || 'order.created')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean),
    retryDelaysMs: parseNumberList(process.env.RABBITMQ_RETRY_DELAYS_MS, [5000, 30000, 120000]),
  };
}
