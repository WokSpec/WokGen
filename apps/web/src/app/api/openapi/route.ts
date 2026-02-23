import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'WokGen API',
      version: '1.0.0',
      description: 'Multi-engine AI asset generation API',
    },
    servers: [
      { url: 'https://wokgen.wokspec.org', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'wk_live_{48hex}',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/api/generate': {
        post: {
          summary: 'Generate an AI asset',
          operationId: 'generate',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt'],
                  properties: {
                    prompt:    { type: 'string', description: 'Generation prompt' },
                    mode:      { type: 'string', description: 'Generation mode (pixel, vector, emoji, etc.)' },
                    tool:      { type: 'string', description: 'Tool identifier' },
                    width:     { type: 'integer', description: 'Output width in pixels' },
                    height:    { type: 'integer', description: 'Output height in pixels' },
                    provider:  { type: 'string', description: 'AI provider override' },
                    seed:      { type: 'integer', description: 'Random seed for reproducibility' },
                    negPrompt: { type: 'string', description: 'Negative prompt' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Generation successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resultUrl:  { type: 'string', format: 'uri' },
                      jobId:      { type: 'string' },
                      durationMs: { type: 'integer' },
                      provider:   { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '503': { description: 'Service unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/gallery': {
        get: {
          summary: 'List gallery assets',
          operationId: 'listGallery',
          parameters: [
            { name: 'page',   in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'mine',   in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Gallery assets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      assets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id:       { type: 'string' },
                            imageUrl: { type: 'string', format: 'uri' },
                            prompt:   { type: 'string' },
                            tool:     { type: 'string' },
                            rarity:   { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/health': {
        get: {
          summary: 'Health check',
          operationId: 'health',
          security: [],
          responses: {
            '200': {
              description: 'Service health',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      redis:  { type: 'boolean' },
                      uptime: { type: 'number', description: 'Uptime in seconds' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/quota': {
        get: {
          summary: 'Get quota usage',
          operationId: 'getQuota',
          responses: {
            '200': {
              description: 'Quota info',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      used:  { type: 'integer' },
                      limit: { type: 'integer' },
                      plan:  { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/jobs/{id}': {
        get: {
          summary: 'Get job by ID',
          operationId: 'getJob',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Job details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id:        { type: 'string' },
                      status:    { type: 'string' },
                      resultUrl: { type: 'string', format: 'uri' },
                      tool:      { type: 'string' },
                      prompt:    { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/projects': {
        get: {
          summary: 'List projects',
          operationId: 'listProjects',
          responses: {
            '200': {
              description: 'Projects list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      projects: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a project',
          operationId: 'createProject',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name:        { type: 'string' },
                    mode:        { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Project created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      project: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/keys': {
        get: {
          summary: 'List API keys',
          operationId: 'listKeys',
          responses: {
            '200': {
              description: 'API keys',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      keys: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id:        { type: 'string' },
                            name:      { type: 'string' },
                            keyPrefix: { type: 'string' },
                            scopes:    { type: 'array', items: { type: 'string' } },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create an API key',
          operationId: 'createKey',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name:   { type: 'string' },
                    scopes: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Key created (raw key shown once)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      key:    { type: 'string', description: 'Raw key — shown once, store securely' },
                      id:     { type: 'string' },
                      prefix: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/keys/{id}': {
        delete: {
          summary: 'Revoke an API key',
          operationId: 'deleteKey',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '204': { description: 'Key revoked' },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
