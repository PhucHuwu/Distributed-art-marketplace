import { randomUUID } from 'node:crypto';

export function ensureCorrelationId(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return randomUUID();
}
