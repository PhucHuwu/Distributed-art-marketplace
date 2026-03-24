import { prisma } from '../lib/prisma';
import { NormalizedAuditEvent } from '../types/event';
import { AuditLogQuery, buildAuditWhere, parseLimit } from '../utils/query';

type PrismaKnownRequestErrorLike = {
  code?: string;
  meta?: { target?: unknown };
};

function isUniqueConstraintError(error: unknown): boolean {
  const known = error as PrismaKnownRequestErrorLike;

  if (known.code !== 'P2002') {
    return false;
  }

  if (!Array.isArray(known.meta?.target)) {
    return true;
  }

  const target = known.meta.target as string[];
  return target.includes('event_id') || target.includes('eventId');
}

export async function saveAuditLog(normalizedEvent: NormalizedAuditEvent): Promise<boolean> {
  try {
    await prisma.eventLog.create({
      data: {
        eventId: normalizedEvent.eventId,
        eventType: normalizedEvent.eventType,
        serviceName: normalizedEvent.serviceName,
        aggregateId: normalizedEvent.aggregateId,
        orderId: normalizedEvent.orderId,
        userId: normalizedEvent.userId,
        payload: normalizedEvent.payload,
        occurredAt: normalizedEvent.occurredAt,
        correlationId: normalizedEvent.correlationId,
        version: normalizedEvent.version,
      },
    });

    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }

    throw error;
  }
}

export async function getAuditLogs(query: AuditLogQuery & { limit?: string }) {
  const where = buildAuditWhere(query);
  const limit = parseLimit(query.limit);

  const items = await prisma.eventLog.findMany({
    where,
    orderBy: { occurredAt: 'desc' },
    take: limit,
  });

  return {
    items,
    meta: {
      limit,
      count: items.length,
    },
  };
}

export async function getAuditLogByEventId(eventId: string) {
  return prisma.eventLog.findUnique({ where: { eventId } });
}
