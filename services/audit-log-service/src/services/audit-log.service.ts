import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NormalizedAuditEvent } from '../types/event';
import { AuditLogQuery, buildAuditWhere, parseLimit } from '../utils/query';

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
    const known = error as Prisma.PrismaClientKnownRequestError & {
      meta?: { target?: unknown };
    };

    if (known.code === 'P2002' && Array.isArray(known.meta?.target)) {
      const target = known.meta.target as string[];
      if (target.includes('event_id')) {
        return false;
      }
    }

    if (known.code === 'P2002') {
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
