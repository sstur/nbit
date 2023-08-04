import { Request, Response } from '../applicationTypes';
import { defineAdapter } from '../core/defineAdapter';

describe('defineAdapter', () => {
  const createApplication = defineAdapter((_applicationOptions) => {
    return {
      onError: (request, error) => {
        return new Response(String(error), { status: 500 });
      },
      toResponse: async (request, result) => {
        if (result instanceof Response) {
          return result;
        }
        if (result === undefined) {
          return new Response('Not found', { status: 404 });
        }
        return Response.json(result);
      },
      createNativeHandler: (handleRequest) => handleRequest,
    };
  });
  const { defineRoutes, attachRoutes } = createApplication({
    errorHandler: (error) => {
      const { name, message } = error;
      if (message === 'Special error') {
        throw new Error('Thrown from errorHandler');
      }
      return Response.json({ name, message }, { status: 500 });
    },
  });
  const routes = defineRoutes((app) => [
    app.get('/foo/:id', (request) => {
      return { id: request.params.id };
    }),
  ]);

  it('should handle a normal route', async () => {
    const requestHandler = attachRoutes(routes);
    const request = new Request('http://localhost/foo/123');
    const response = await requestHandler(request);
    expect(response.body).toEqual(JSON.stringify({ id: '123' }));
  });

  it('should return 404 response for unknown route', async () => {
    const requestHandler = attachRoutes(routes);
    const request = new Request('http://localhost/baz');
    const response = await requestHandler(request);
    expect(response.status).toBe(404);
    expect(response.body).toBe('Not found');
  });

  it('should allow custom 404 handler', async () => {
    const fallback = defineRoutes((app) => [
      app.route('*', '/*', (_request) => {
        return new Response('Oops, 404', { status: 404 });
      }),
    ]);
    const requestHandler = attachRoutes(routes, fallback);
    const request = new Request('http://localhost/baz');
    const response = await requestHandler(request);
    expect(response.status).toBe(404);
    expect(response.body).toBe('Oops, 404');
  });

  it('should invoke custom errorHandler', async () => {
    const routes = defineRoutes((app) => [
      app.get('/error', () => {
        throw new Error('Oops');
      }),
    ]);
    const requestHandler = attachRoutes(routes);
    const request = new Request('http://localhost/error');
    const response = await requestHandler(request);
    expect(response.status).toBe(500);
    expect(response.body).toBe(
      JSON.stringify({ name: 'Error', message: 'Oops' }),
    );
  });

  it('should fall back to default error handler if custom errorHandler throws', async () => {
    const routes = defineRoutes((app) => [
      app.get('/error', () => {
        throw new Error('Special error');
      }),
    ]);
    const requestHandler = attachRoutes(routes);
    const request = new Request('http://localhost/error');
    const response = await requestHandler(request);
    expect(response.status).toBe(500);
    expect(response.body).toBe('Error: Thrown from errorHandler');
  });
});
