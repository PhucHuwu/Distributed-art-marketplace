import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { EventEnvelopeV1 } from '../types/event';
import { createEventEnvelope } from '../utils/event-envelope';
import { resolveLifecycleTransition } from './lifecycle-transition';

type ProcessEventDeps = {
  serviceName: string;
  publishEvent: (routingKey: string, event: EventEnvelopeV1) => Promise<void>;
};

export async function processOrderEvent(envelope: EventEnvelopeV1, deps: ProcessEventDeps): Promise<void> {
  const payload = envelope.payload as Record<string, unknown>;
  const orderId = typeof payload.orderId === 'string' ? payload.orderId : null;

  if (!orderId) {
    throw new Error('Invalid event payload: missing orderId');
  }

  const result = await prisma.$transaction(async (tx) => {
    try {
      await tx.processedEvent.create({
        data: {
          eventId: envelope.eventId,
          eventType: envelope.eventType,
          correlationId: envelope.correlationId,
        },
      });
    } catch (error) {
      const known = error as Prisma.PrismaClientKnownRequestError;
      if (known.code === 'P2002') {
        return { duplicate: true as const };
      }
      throw error;
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { duplicate: false as const, changed: false as const };
    }

    const transition = resolveLifecycleTransition({
      currentStatus: order.status,
      eventType: envelope.eventType,
      payload,
    });

    if (!transition) {
      return { duplicate: false as const, changed: false as const };
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: transition.nextStatus },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: transition.nextStatus,
        reason: transition.reason,
        eventId: envelope.eventId,
      },
    });

    return {
      duplicate: false as const,
      changed: true as const,
      orderId: order.id,
      userId: order.userId,
      transition,
      correlationId: envelope.correlationId,
    };
  });

  if (result.duplicate) {
    logger.info(
      { eventId: envelope.eventId, correlationId: envelope.correlationId },
      'Duplicate event skipped by idempotency guard',
    );
    return;
  }

  if (!result.changed) {
    logger.info(
      {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        correlationId: envelope.correlationId,
      },
      'Event ignored due to unsupported state transition or missing order',
    );
    return;
  }

  if (result.transition.publishEventType) {
    const publishPayload = {
      orderId: result.orderId,
      userId: result.userId,
      ...(result.transition.publishPayload || {}),
    };

    const publishEnvelope = createEventEnvelope({
      eventType: result.transition.publishEventType,
      payload: publishPayload,
      correlationId: result.correlationId,
      producer: deps.serviceName,
    });

    await deps.publishEvent(result.transition.publishEventType, publishEnvelope);
  }
}
