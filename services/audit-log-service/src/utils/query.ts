export type AuditLogQuery = {
  userId?: string;
  orderId?: string;
  service?: string;
  eventType?: string;
  from?: string;
  to?: string;
};

export function buildAuditWhere(query: AuditLogQuery): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (query.userId) {
    where.userId = query.userId;
  }

  if (query.orderId) {
    where.orderId = query.orderId;
  }

  if (query.service) {
    where.serviceName = query.service;
  }

  if (query.eventType) {
    where.eventType = query.eventType;
  }

  if (query.from || query.to) {
    const occurredAt: Record<string, Date> = {};

    if (query.from) {
      occurredAt.gte = new Date(query.from);
    }

    if (query.to) {
      occurredAt.lte = new Date(query.to);
    }

    where.occurredAt = occurredAt;
  }

  return where;
}

export function parseLimit(limit?: string): number {
  if (!limit) {
    return 50;
  }

  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(parsed, 200);
}
