const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Payment Service API',
    version: 'v1',
    description:
      'Payment transaction APIs with state transition rules and webhook callback stub. Publishes payment.success and payment.failed events.',
  },
  servers: [{ url: 'http://localhost:3006' }],
  tags: [
    { name: 'Payments', description: 'Payment transaction endpoints' },
    { name: 'Webhook', description: 'Payment provider webhook callback endpoint' },
  ],
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
      CreatePaymentRequest: {
        type: 'object',
        required: ['orderId', 'amount', 'currency', 'provider'],
        properties: {
          orderId: { type: 'string' },
          userId: { type: 'string', nullable: true },
          amount: { type: 'number', minimum: 0.01 },
          currency: { type: 'string', example: 'VND' },
          provider: { type: 'string', example: 'mock-provider' },
          processingResult: { type: 'string', enum: ['SUCCESS', 'FAILED'] },
          providerReference: { type: 'string' },
          failureCode: { type: 'string' },
          failureMessage: { type: 'string' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderId: { type: 'string' },
          userId: { type: 'string', nullable: true },
          amount: { type: 'string', example: '100000.00' },
          currency: { type: 'string' },
          provider: { type: 'string' },
          status: { type: 'string', enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED'] },
          providerReference: { type: 'string', nullable: true },
          failureCode: { type: 'string', nullable: true },
          failureMessage: { type: 'string', nullable: true },
          correlationId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          processedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      PaymentWithHistory: {
        type: 'object',
        properties: {
          payment: { $ref: '#/components/schemas/Payment' },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                fromStatus: {
                  type: 'string',
                  enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED'],
                  nullable: true,
                },
                toStatus: { type: 'string', enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED'] },
                reason: { type: 'string', nullable: true },
                correlationId: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: {} },
            },
          },
          correlationId: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Payments'],
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
    '/payments': {
      post: {
        tags: ['Payments'],
        summary: 'Create and process payment transaction',
        description:
          'Creates INITIATED payment, transitions to PROCESSING, then final SUCCESS or FAILED. Publishes payment.success or payment.failed event with envelope v1.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePaymentRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment created and processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Payment' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'System error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/payments/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment detail and transition history',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Payment detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/PaymentWithHistory' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Payment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/payments/webhook/{provider}': {
      post: {
        tags: ['Webhook'],
        summary: 'Payment provider callback stub endpoint',
        parameters: [{ name: 'provider', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          202: {
            description: 'Webhook accepted (stub)',
          },
        },
      },
    },
  },
};

export { openApiSpec };
