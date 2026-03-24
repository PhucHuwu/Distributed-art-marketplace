const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Order Service API',
    version: 'v1',
    description:
      'Order APIs for cart management and order lifecycle. This service publishes order.created/order.completed/order.failed and consumes inventory/payment events with idempotent processing by eventId.',
  },
  servers: [{ url: 'http://localhost:3005' }],
  tags: [
    { name: 'Cart', description: 'Cart item operations' },
    { name: 'Orders', description: 'Order operations and lifecycle query' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
            },
          },
          correlationId: { type: 'string', nullable: true },
        },
      },
      CartItemInput: {
        type: 'object',
        required: ['artworkId', 'quantity', 'unitPrice'],
        properties: {
          artworkId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0.01 },
        },
      },
      UpdateCartItemInput: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1 },
        },
      },
      CreateOrderInput: {
        type: 'object',
        required: ['shippingAddress'],
        properties: {
          shippingAddress: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Orders'],
        summary: 'Healthcheck endpoint',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/orders/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get active cart',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Cart returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to active cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CartItemInput' },
            },
          },
        },
        responses: {
          201: { description: 'Cart item added' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/cart/items/{id}': {
      put: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCartItemInput' },
            },
          },
        },
        responses: {
          200: { description: 'Cart item updated' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove cart item',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Cart item removed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order from active cart with initial status PENDING',
        description:
          'On success, this endpoint publishes order.created event and snapshots shippingAddress and pricing at creation time.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderInput' },
            },
          },
        },
        responses: {
          201: { description: 'Order created' },
          400: { description: 'Validation error or empty cart' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order detail by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order returned' },
          401: { description: 'Unauthorized' },
          404: { description: 'Not found' },
        },
      },
    },
    '/orders/me': {
      get: {
        tags: ['Orders'],
        summary: 'List current user orders',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Orders returned' },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};

export { openApiSpec };
