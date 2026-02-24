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
      '/api/credits': {
        get: {
          summary: 'Get credit balance',
          operationId: 'getCredits',
          responses: {
            '200': {
              description: 'Credit balance and plan info',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      credits:  { type: 'integer' },
                      plan:     { type: 'string' },
                      resetAt:  { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/notifications': {
        get: {
          summary: 'List unread notifications',
          operationId: 'listNotifications',
          responses: {
            '200': {
              description: 'Unread notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      notifications: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id:        { type: 'string' },
                            type:      { type: 'string' },
                            title:     { type: 'string' },
                            body:      { type: 'string' },
                            link:      { type: 'string' },
                            read:      { type: 'boolean' },
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
        patch: {
          summary: 'Mark all notifications as read',
          operationId: 'markNotificationsRead',
          responses: {
            '200': { description: 'Marked as read' },
          },
        },
      },
      '/api/usage': {
        get: {
          summary: 'Get usage statistics',
          operationId: 'getUsage',
          parameters: [
            { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: 'Usage stats including daily breakdown and job history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      allTime:    { type: 'object' },
                      thisMonth:  { type: 'object' },
                      today:      { type: 'object' },
                      dailyChart: { type: 'array', items: { type: 'object' } },
                      byMode:     { type: 'object' },
                      quota:      { type: 'object' },
                      jobs:       { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/stats': {
        get: {
          summary: 'Get platform statistics',
          operationId: 'getStats',
          responses: {
            '200': {
              description: 'Platform-wide stats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalGenerations: { type: 'integer' },
                      totalUsers:       { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/workspaces': {
        get: {
          summary: 'List workspaces',
          operationId: 'listWorkspaces',
          responses: {
            '200': {
              description: 'User workspaces',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workspaces: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a workspace',
          operationId: 'createWorkspace',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Workspace created' },
          },
        },
      },
      '/api/preferences': {
        get: {
          summary: 'Get user preferences',
          operationId: 'getPreferences',
          responses: {
            '200': {
              description: 'User preferences',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update user preferences',
          operationId: 'updatePreferences',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '200': { description: 'Preferences updated' },
          },
        },
      },
      '/api/webhooks/user': {
        get: {
          summary: 'List user webhooks',
          operationId: 'listWebhooks',
          responses: {
            '200': {
              description: 'User-defined webhooks',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      webhooks: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id:              { type: 'string' },
                            url:             { type: 'string', format: 'uri' },
                            events:          { type: 'string', description: 'Comma-separated event list' },
                            active:          { type: 'boolean' },
                            lastStatus:      { type: 'string' },
                            lastTriggeredAt: { type: 'string', format: 'date-time' },
                            createdAt:       { type: 'string', format: 'date-time' },
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
          summary: 'Create a webhook',
          operationId: 'createWebhook',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['url', 'events'],
                  properties: {
                    url:    { type: 'string', format: 'uri' },
                    events: { type: 'string', description: 'Comma-separated event names, e.g. "generation.complete,job.failed"' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Webhook created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      webhook: { type: 'object' },
                      secret:  { type: 'string', description: 'HMAC secret — shown once' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/referrals': {
        get: {
          summary: 'Get referral code and list',
          operationId: 'getReferrals',
          responses: {
            '200': {
              description: 'Referral info',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code:      { type: 'string', description: 'User referral code' },
                      referrals: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Process a referral code',
          operationId: 'processReferral',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: { type: 'string', description: 'Referral code from cookie' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Referral processed' },
            '400': { description: 'Invalid or already used code' },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
