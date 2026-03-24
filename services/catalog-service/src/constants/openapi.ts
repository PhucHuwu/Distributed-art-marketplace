const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Catalog Service API',
    version: 'v1',
    description:
      'Read-heavy artwork catalog APIs with admin write endpoints for artworks, artists, and categories.',
  },
  servers: [{ url: 'http://localhost:3003' }],
  tags: [
    { name: 'Catalog', description: 'Public catalog APIs' },
    { name: 'Artists', description: 'Public artist APIs' },
    { name: 'Categories', description: 'Public category APIs' },
    { name: 'Admin', description: 'Admin write endpoints' },
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
        tags: ['Catalog'],
        summary: 'Healthcheck endpoint',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/catalog/artworks': {
      get: {
        tags: ['Catalog'],
        summary: 'List artworks with pagination and filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'artist', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List artworks successfully' },
          400: { description: 'Invalid query params' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create artwork',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Artwork created' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Conflict' },
        },
      },
    },
    '/catalog/artworks/{idOrSlug}': {
      get: {
        tags: ['Catalog'],
        summary: 'Get artwork detail by id or slug',
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Artwork found' },
          404: { description: 'Artwork not found' },
        },
      },
    },
    '/catalog/artworks/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update artwork by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Artwork updated' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Artwork not found' },
          409: { description: 'Conflict' },
        },
      },
    },
    '/catalog/artists': {
      get: {
        tags: ['Artists'],
        summary: 'List artists',
        responses: {
          200: { description: 'List artists successfully' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create artist',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Artist created' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Conflict' },
        },
      },
    },
    '/catalog/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: {
          200: { description: 'List categories successfully' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create category',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Category created' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          409: { description: 'Conflict' },
        },
      },
    },
    '/catalog/artists/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update artist',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Artist updated' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
          409: { description: 'Conflict' },
        },
      },
    },
    '/catalog/categories/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update category',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Category updated' },
          400: { description: 'Invalid payload' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
          409: { description: 'Conflict' },
        },
      },
    },
  },
};

export { openApiSpec };
