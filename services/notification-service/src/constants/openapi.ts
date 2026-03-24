const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Notification Service API',
    version: 'v1',
    description:
      'Internal/debug APIs for notification consumer service. Consumes order.completed, order.failed, and payment.failed; supports retry/backoff and DLQ-ready flow.',
  },
  servers: [{ url: 'http://localhost:3007' }],
  tags: [{ name: 'Notifications', description: 'Internal debug endpoints for notification flow' }],
  components: {
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
      ConsumerStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              processedEvents: { type: 'integer' },
              duplicatedEvents: { type: 'integer' },
              failedEvents: { type: 'integer' },
              retriedEvents: { type: 'integer' },
              sentNotifications: { type: 'integer' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Notifications'],
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
    '/notifications/stats': {
      get: {
        tags: ['Notifications'],
        summary: 'Get in-memory consumer statistics',
        responses: {
          200: {
            description: 'Consumer runtime stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ConsumerStatsResponse' },
              },
            },
          },
        },
      },
    },
    '/notifications/debug/emit': {
      post: {
        tags: ['Notifications'],
        summary: 'Debug endpoint to process a sample event payload locally',
        description:
          'Useful for validating mapper/provider flow without waiting for RabbitMQ. Event format must follow envelope v1.',
        responses: {
          202: {
            description: 'Debug event accepted',
          },
          400: {
            description: 'Invalid event payload',
          },
        },
      },
    },
  },
};

export { openApiSpec };
