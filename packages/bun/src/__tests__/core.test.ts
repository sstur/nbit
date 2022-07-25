import { describe, expect, it } from 'bun:test';

import { createApplication } from '../bun';

describe('createApplication', () => {
  const { defineRoutes, attachRoutes } = createApplication();

  const routes = defineRoutes((app) => [
    app.get('/', async (request) => {
      return { path: request.path };
    }),
    app.get('/foo', async (_request) => {
      return Response.json(
        { foo: 42 },
        {
          status: 418,
          // statusText: 'I like tea',
          headers: { 'X-My-Header': 'hello' },
        },
      );
    }),
    app.post('/auth', async (request) => {
      const body = await request.json();
      return { body };
    }),
  ]);

  it('should reflect that routes have been defined', async () => {
    expect(routes.length).toBe(3);
    const serializable = routes.map(([method, path, handler]) => [
      method,
      path,
      typeof handler,
    ]);
    expect(JSON.stringify(serializable)).toBe(
      JSON.stringify([
        ['GET', '/', 'function'],
        ['GET', '/foo', 'function'],
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

  it('should handle custom response status and headers', async () => {
    const requestHandler = attachRoutes(routes);
    const mockRequest = new Request('http://localhost/foo');
    const response = await requestHandler(mockRequest);
    expect(response.status).toBe(418);
    // This is currently failing in latest Bun 0.1.5
    // expect(response.statusText).toBe('I like tea');
    const headers = Object.fromEntries(response.headers.entries());
    expect(JSON.stringify(headers)).toBe(
      JSON.stringify({
        'content-type': 'application/json;charset=utf-8',
        'x-my-header': 'hello',
      }),
    );
    const parsed = await response.json();
    expect(JSON.stringify(parsed)).toBe(JSON.stringify({ foo: 42 }));
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
