import { Request, Response } from '../../web-io';
import { defineAdapter } from '../defineAdapter';

describe('routeRequest', () => {
  const createApplication = defineAdapter((_applicationOptions) => {
    return {
      onError: (request, error) => {
        return new Response(String(error), { status: 500 });
      },
      toResponse: async (request, result) => {
        if (result instanceof Response || result === undefined) {
          return result;
        }
        const { filePath, responseInit } = result;
        return new Response(filePath, responseInit);
      },
      createNativeHandler: (handleRequest) => handleRequest,
    };
  });

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
    const request = new Request('http://localhost/');
    const response = await handleRequest(request);
    expect(response.status).toBe(200);
    const contentType = response.headers.get('content-type') ?? '';
    // In some implementations there will be `;charset=utf-8`
    expect(contentType.split(';')[0]).toBe('application/json');
    const parsed = await response.json();
    expect(parsed).toEqual({ path: '/' });
  });

  it('should handle custom response status and headers', async () => {
    const handleRequest = createRequestHandler(routes);
    const request = new Request('http://localhost/foo');
    const response = await handleRequest(request);
    expect(response.status).toBe(418);
    // Temporarily disabled because statusText this is broken in Bun
    // https://github.com/oven-sh/bun/issues/866
    // expect(response.statusText).toBe('I like tea');
    const contentType = response.headers.get('content-type') ?? '';
    // In some implementations there will be `;charset=utf-8`
    expect(contentType.split(';')[0]).toBe('application/json');
    expect(response.headers.get('x-my-header')).toBe('hello');
    const parsed = await response.json();
    expect(parsed).toEqual({ foo: 42 });
  });

  it('should handle a POST request with JSON body', async () => {
    const handleRequest = createRequestHandler(routes);
    const request = new Request('http://localhost/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ foo: 1 }),
    });
    const response = await handleRequest(request);
    expect(response.status).toBe(200);
    const contentType = response.headers.get('content-type') ?? '';
    // In some implementations there will be `;charset=utf-8`
    expect(contentType.split(';')[0]).toBe('application/json');
    const parsed = await response.json();
    expect(parsed).toEqual({ body: { foo: 1 } });
  });

  it('should throw correct JSON serialization error', async () => {
    const routes = defineRoutes((app) => [
      app.get('/a', async (_request) => {
        const data: Record<string, unknown> = { a: 1 };
        data.circ = data;
        return Response.json(data);
      }),
      app.get('/b', async (_request) => {
        const data: Record<string, unknown> = { b: 2 };
        data.circ = data;
        return data;
      }),
    ]);
    const handleRequest = createRequestHandler(routes);
    const request = new Request('http://localhost/a');
    const response = await handleRequest(request);
    expect(response.status).toBe(500);
    const message = (await response.text()).split('\n')[0];
    // Depending on JS engine, message will one of the following:
    // - TypeError: Converting circular structure to JSON
    // - TypeError: JSON.stringify cannot serialize cyclic structures.
    expect(message?.startsWith('TypeError:')).toBe(true);
    const request2 = new Request('http://localhost/b');
    const response2 = await handleRequest(request2);
    expect(response2.status).toBe(500);
    const message2 = await response2.text();
    const lines = message2.split('\n').map((s) => s.trim());
    expect(lines[0]).toBe(
      'StringifyError: Failed to stringify value returned from route handler: GET:/b',
    );
    expect(lines[1]?.startsWith('TypeError:')).toBe(true);
  });
});
