import { expectTypeOf } from 'expect-type';

import { Request, Response } from '../../web-io';
import { defineAdapter } from '../defineAdapter';

type BodyStream = Exclude<Request['body'], null>;

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
    expect(await response.json()).toEqual({ id: '123' });
  });

  it('should return 404 response for unknown route', async () => {
    const requestHandler = attachRoutes(routes);
    const request = new Request('http://localhost/baz');
    const response = await requestHandler(request);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
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
    expect(await response.text()).toBe('Oops, 404');
  });

  it('should use TS to disallow body operations on non-body methods', () => {
    defineRoutes((app) => [
      app.get('/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'GET'>();
        expectTypeOf(request.body).toEqualTypeOf<null>();
        // @ts-expect-error - Should not be able to call method that requires request body
        request.json();
        // @ts-expect-error - Should not be able to call method that requires request body
        request.text();
        // @ts-expect-error - Should not be able to call method that requires request body
        request.arrayBuffer();
      }),
      app.delete('/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'DELETE'>();
        expectTypeOf(request.body).toEqualTypeOf<null>();
      }),
      app.post('/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'POST'>();
        expectTypeOf(request.body).toEqualTypeOf<BodyStream>();
      }),
      app.route('HEAD', '/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'HEAD'>();
        expectTypeOf(request.body).toEqualTypeOf<null>();
      }),
      app.route('POST', '/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'POST'>();
        expectTypeOf(request.body).toEqualTypeOf<BodyStream>();
      }),
    ]);
  });

  it('should uppercase request method', async () => {
    const routes = defineRoutes((app) => [
      app.route('get', '/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'GET'>();
      }),
      app.route('foo', '/', (request) => {
        expectTypeOf(request.method).toEqualTypeOf<'FOO'>();
      }),
    ]);
    const serializable = routes.map(([method, path, handler]) => [
      method,
      path,
      typeof handler,
    ]);
    expect(serializable).toEqual([
      ['GET', '/', 'function'],
      ['FOO', '/', 'function'],
    ]);
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
    expect(await response.json()).toEqual({ name: 'Error', message: 'Oops' });
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
    expect(await response.text()).toBe('Error: Thrown from errorHandler');
  });
});
