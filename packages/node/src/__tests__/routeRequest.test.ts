import { createApplication, Response } from '..';
import { Request } from '../Request';

describe('createApplication', () => {
  const { defineRoutes, createRequestHandler } = createApplication();

  const routes = defineRoutes((app) => [
    app.get('/', async (request) => {
      return { path: request.path };
    }),
    app.get('/foo', async (_request) => {
      return Response.json(
        { foo: 42 },
        {
          status: 418,
          statusText: 'I like tea',
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
    expect(serializable).toEqual([
      ['GET', '/', 'function'],
      ['GET', '/foo', 'function'],
      ['POST', '/auth', 'function'],
    ]);
    const handleRequest = createRequestHandler(routes);
    expect(typeof handleRequest).toBe('function');
  });

  it('should handle a GET request', async () => {
    const handleRequest = createRequestHandler(routes);
    const request = new Request('/');
    const response = await handleRequest(request);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('');
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers).toEqual({
      'Content-Type': 'application/json; charset=UTF-8',
    });
    const parsed = await response.json();
    expect(parsed).toEqual({ path: '/' });
  });

  it('should handle custom response status and headers', async () => {
    const handleRequest = createRequestHandler(routes);
    const request = new Request('/foo');
    const response = await handleRequest(request);
    expect(response.status).toBe(418);
    expect(response.statusText).toBe('I like tea');
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers).toEqual({
      'Content-Type': 'application/json; charset=UTF-8',
      'X-My-Header': 'hello',
    });
    const parsed = await response.json();
    expect(parsed).toEqual({ foo: 42 });
  });

  it('should handle a POST request with JSON body', async () => {
    const handleRequest = createRequestHandler(routes);
    const request = new Request('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ foo: 1 }),
    });
    const response = await handleRequest(request);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('');
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers).toEqual({
      'Content-Type': 'application/json; charset=UTF-8',
    });
    const parsed = await response.json();
    expect(parsed).toEqual({ body: { foo: 1 } });
  });
});
