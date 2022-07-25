import { describe, expect, it } from 'bun:test';

import { createApplication } from '../bun';

describe('createApplication', () => {
  const { defineRoutes, attachRoutes } = createApplication();

  const routes = defineRoutes((app) => [
    app.get('/', async (request) => {
      return Response.json({ path: request.path });
    }),
    app.post('/auth', async (request) => {
      const body = await request.json();
      return { body };
    }),
  ]);

  it('should reflect that routes have been defined', async () => {
    expect(routes.length).toBe(2);
    const serializable = routes.map(([method, path, handler]) => [
      method,
      path,
      typeof handler,
    ]);
    expect(JSON.stringify(serializable)).toBe(
      JSON.stringify([
        ['GET', '/', 'function'],
        ['POST', '/auth', 'function'],
      ]),
    );
    const requestHandler = attachRoutes(routes);
    expect(typeof requestHandler).toBe('function');
  });

  it('should handle a GET request', async () => {
    const requestHandler = attachRoutes(routes);
    const mockRequest = new Request('http://localhost/');
    const response = await requestHandler(mockRequest);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('');
    const headers = Object.fromEntries(response.headers.entries());
    expect(JSON.stringify(headers)).toBe(
      JSON.stringify({ 'content-type': 'application/json;charset=utf-8' }),
    );
    const parsed = await response.json();
    expect(JSON.stringify(parsed)).toBe(JSON.stringify({ path: '/' }));
  });

  it('should handle a POST request with JSON body', async () => {
    const requestHandler = attachRoutes(routes);
    const mockRequest = new Request('http://localhost/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ foo: 1 }),
    });
    const response = await requestHandler(mockRequest);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('');
    const headers = Object.fromEntries(response.headers.entries());
    expect(JSON.stringify(headers)).toBe(
      JSON.stringify({ 'content-type': 'application/json;charset=utf-8' }),
    );
    const parsed = await response.json();
    expect(JSON.stringify(parsed)).toBe(JSON.stringify({ body: { foo: 1 } }));
  });
});
