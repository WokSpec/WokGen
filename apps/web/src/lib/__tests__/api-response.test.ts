import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, API_ERRORS } from '../api-response';

describe('api-response', () => {
  it('apiSuccess returns a Response with the data and default 200 status', async () => {
    const response = apiSuccess({ id: '1', name: 'test' });
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: '1', name: 'test' });
  });

  it('apiSuccess accepts a custom status code', async () => {
    const response = apiSuccess({ created: true }, 201);
    expect(response.status).toBe(201);
  });

  it('apiError returns a Response with error shape', async () => {
    const response = apiError({ message: 'Not found', code: 'NOT_FOUND', status: 404 });
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'Not found', code: 'NOT_FOUND', status: 404 });
  });

  it('API_ERRORS.UNAUTHORIZED returns 401', async () => {
    const response = API_ERRORS.UNAUTHORIZED();
    expect(response.status).toBe(401);
  });

  it('API_ERRORS.NOT_FOUND uses default resource name', async () => {
    const response = API_ERRORS.NOT_FOUND();
    const body = await response.json();
    expect(body.error).toContain('not found');
  });

  it('API_ERRORS.BAD_REQUEST includes custom message', async () => {
    const response = API_ERRORS.BAD_REQUEST('Invalid input');
    const body = await response.json();
    expect(body.error).toBe('Invalid input');
  });
});
