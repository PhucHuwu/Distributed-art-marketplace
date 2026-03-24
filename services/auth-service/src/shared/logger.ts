interface LogMeta {
  [key: string]: unknown;
}

const redactValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (
      lowerValue.includes('bearer ') ||
      lowerValue.includes('token') ||
      lowerValue.includes('password') ||
      lowerValue.includes('secret')
    ) {
      return '[REDACTED]';
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = redactValue(item);
      }
    }
    return output;
  }

  return value;
};

const buildLog = (level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta): string => {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redactValue(meta) } : {}),
  });
};

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.info(buildLog('info', message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(buildLog('warn', message, meta));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(buildLog('error', message, meta));
  },
};
