const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Audit Log Service API',
    version: 'v1',
    description:
      'Admin audit APIs for querying normalized event logs. This service consumes order.*, inventory.*, and payment.* events.',
  },
  servers: [{ url: 'http://localhost:3008' }],
  tags: [{ name: 'Admin Audit', description: 'Admin endpoints for audit investigation' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          service: { type: 'string' },
          status: { type: 'string', enum: ['ok', 'degraded'] },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      EventLogItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
          eventType: { type: 'string' },
          serviceName: { type: 'string' },
          aggregateId: { type: 'string', nullable: true },
          orderId: { type: 'string', nullable: true },
          userId: { type: 'string', nullable: true },
          payload: { type: 'object' },
          occurredAt: { type: 'string', format: 'date-time' },
          receivedAt: { type: 'string', format: 'date-time' },
          correlationId: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Admin Audit'],
        summary: 'Healthcheck endpoint',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/audit-logs': {
      get: {
        tags: ['Admin Audit'],
        summary: 'List audit logs with filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'orderId', in: 'query', schema: { type: 'string' } },
          { name: 'service', in: 'query', schema: { type: 'string' } },
          { name: 'eventType', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } },
        ],
        responses: {
          200: {
            description: 'List audit logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/EventLogItem' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        limit: { type: 'integer' },
                        count: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/admin/audit-logs/{eventId}': {
      get: {
        tags: ['Admin Audit'],
        summary: 'Get audit log detail by eventId',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'eventId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Audit log detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/EventLogItem' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
        },
      },
    },
  },
};

export { openApiSpec };
