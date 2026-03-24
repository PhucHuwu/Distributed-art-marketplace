const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'User Profile Service API',
    version: 'v1',
    description:
      'User profile APIs for /users/me and address CRUD. Endpoints are JWT-protected and enforce one default address per user.',
  },
  servers: [{ url: 'http://localhost:3002' }],
  tags: [
    { name: 'Users', description: 'User profile endpoints' },
    { name: 'Addresses', description: 'User address management endpoints' },
  ],
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
        tags: ['Users'],
        summary: 'Healthcheck endpoint',
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get my profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update my profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile updated' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'List my addresses',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Address list' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Addresses'],
        summary: 'Create a new address',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Address created' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/addresses/{id}': {
      put: {
        tags: ['Addresses'],
        summary: 'Update an address',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Address updated' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          404: { description: 'Address not found' },
        },
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete an address',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Address deleted' },
          401: { description: 'Unauthorized' },
          404: { description: 'Address not found' },
        },
      },
    },
  },
};

export { openApiSpec };
