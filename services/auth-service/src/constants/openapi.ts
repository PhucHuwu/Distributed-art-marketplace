const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Auth Service API',
    version: 'v1',
    description:
      'Authentication APIs for credential registration, login, and token verification. Password is hashed with bcrypt and JWT is issued for identity.',
  },
  servers: [{ url: 'http://localhost:3001' }],
  tags: [{ name: 'Auth', description: 'Authentication endpoints' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              tokenType: { type: 'string', example: 'Bearer' },
            },
          },
        },
      },
      VerifyResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
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
              details: { type: 'array', items: { type: 'string' } },
            },
          },
          correlationId: { type: 'string', nullable: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Healthcheck endpoint',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register account by email/password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokenResponse' },
              },
            },
          },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email/password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokenResponse' },
              },
            },
          },
          400: { description: 'Validation error' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Verify JWT token and return identity',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyResponse' },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token skeleton endpoint',
        responses: {
          501: { description: 'Refresh flow not implemented yet' },
        },
      },
    },
  },
};

export { openApiSpec };
