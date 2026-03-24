const requiredKeys = ['SERVICE_PORT', 'DB_URL', 'RABBITMQ_URL', 'JWT_SECRET', 'SERVICE_NAME'] as const;

export type EnvConfig = {
  servicePort: number;
  dbUrl: string;
  rabbitmqUrl: string;
  jwtSecret: string;
  serviceName: string;
};

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
  };
}
