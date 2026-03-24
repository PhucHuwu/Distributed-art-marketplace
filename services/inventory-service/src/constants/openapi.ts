const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Inventory Service API',
    version: 'v1',
    description:
      'Write-heavy stock APIs with order.created event consumer and inventory.reserved/inventory.failed publisher.',
  },
  servers: [{ url: 'http://localhost:3004' }],
  tags: [{ name: 'Inventory', description: 'Stock operations and inventory state APIs' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Inventory'],
        summary: 'Healthcheck endpoint',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/inventory/{artworkId}': {
      get: {
        tags: ['Inventory'],
        summary: 'Get stock snapshot by artworkId',
        parameters: [{ name: 'artworkId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Stock snapshot' },
          400: { description: 'Invalid artwork id' },
        },
      },
    },
    '/inventory/adjust': {
      post: {
        tags: ['Inventory'],
        summary: 'Adjust on-hand stock quantity',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Stock adjusted' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Stock constraint violation' },
        },
      },
    },
    '/inventory/reserve': {
      post: {
        tags: ['Inventory'],
        summary: 'Reserve stock for order items',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Reserved or idempotent hit' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Insufficient stock or state conflict' },
        },
      },
    },
    '/inventory/release': {
      post: {
        tags: ['Inventory'],
        summary: 'Release stock by reservation id',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Released or idempotent hit' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Reservation not found' },
        },
      },
    },
  },
};

export { openApiSpec };
