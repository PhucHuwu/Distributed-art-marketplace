import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production', 'local'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  DB_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải tối thiểu 32 ký tự'),
  JWT_EXPIRES_IN: z.string().min(2),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15),
  JWT_ISSUER: z.string().default('auth-service'),
  JWT_AUDIENCE: z.string().default('distributed-art-marketplace'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  RABBITMQ_URL: z.string().url().optional(),
  EVENT_EXCHANGE: z.string().default('auth.events'),
  EVENT_DLX_EXCHANGE: z.string().default('auth.events.dlx'),
  EVENT_DLQ_QUEUE: z.string().default('auth.publish.dlq'),
  EVENT_PUBLISH_RETRY: z.coerce.number().int().min(1).max(10).default(3),
  DEV_ADMIN_EMAIL: z.string().email().optional(),
  DEV_ADMIN_PASSWORD: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  throw new Error(
    JSON.stringify(
      {
        code: 'ENV_VALIDATION_FAILED',
        message: 'Biến môi trường không hợp lệ hoặc thiếu giá trị bắt buộc',
        details,
      },
      null,
      2,
    ),
  );
}

export const env = parsedEnv.data;
