import { expectTypeOf } from 'expect-type';

import { type Request, type Headers, Response } from '../../web-io';
import CustomResponse from '../CustomResponse';
import type { CustomRequest } from '../CustomRequest';
import { type StaticFile } from '../StaticFile';
import type { JSONValue, Route } from '../../types';
import { defineAdapter } from '../defineAdapter';

describe('Types', () => {
  const createApplication = defineAdapter((_applicationOptions) => {
    return {
      onError: (request, error) => {
        return new Response(String(error), { status: 500 });
      },
      toResponse: async (request, result) => {
        if (result instanceof Response || result === undefined) {
          return result;
        }
        expectTypeOf(result).toEqualTypeOf<StaticFile>();
        const { filePath, responseInit } = result;
        return new Response(filePath, responseInit);
      },
      createNativeHandler: (handleRequest) => handleRequest,
    };
  });

  it('should correctly enforce types on request and params', () => {
    const { defineRoutes } = createApplication();

    const routes = defineRoutes((app) => [
      app.get('/', async (request) => {
        const { method, path, params, headers, query, search } = request;
        expectTypeOf(method).toEqualTypeOf<'GET'>();
        expectTypeOf(path).toEqualTypeOf<string>();
        expectTypeOf(headers).toEqualTypeOf<Headers>();
        expectTypeOf(query).toEqualTypeOf<URLSearchParams>();
        expectTypeOf(search).toEqualTypeOf<string>();
        // @ts-expect-error - Should not be able to access non-existent param
        params.foo;
        // Params should be an empty object
        expectTypeOf<keyof typeof params>().toEqualTypeOf<never>();
        // @ts-expect-error - Should not be able to call .json() on GET request
        await request.json();
      }),
      app.post('/file/:foo', async (request) => {
        const { method, params } = request;
        expectTypeOf(method).toEqualTypeOf<'POST'>();
        expectTypeOf(params).toEqualTypeOf<{ foo: string }>();
        expectTypeOf(params.foo).toEqualTypeOf<string>();
        // @ts-expect-error - Should not be able to access non-existent param
        params.bar;
        const promise = request.json();
        expectTypeOf(promise).toEqualTypeOf<Promise<JSONValue>>();
        const body = await request.json();
        expectTypeOf(body).toEqualTypeOf<JSONValue>();
        return {};
      }),
    ]);

    // No getContext() specified so Request context is undefined
    type Context = undefined;

    expectTypeOf(routes).toEqualTypeOf<Array<Route<Context>>>();
  });

  it('should intersect Response with type returned from getContext', () => {
    const { defineRoutes } = createApplication({
      // TODO: Test that we must return an object here
      getContext: (request) => {
        expectTypeOf(request).toEqualTypeOf<Request>();
        expectTypeOf(request.headers).toEqualTypeOf<Headers>();
        const token = request.headers.get('authorization') ?? '';
        return {
          token,
          getToken: () => token,
          authenticate: async () => {
            return token === 'foo';
          },
        };
      },
    });

    // This is what is returned from getContext above.
    type Context = {
      token: string;
      getToken: () => string;
      authenticate: () => Promise<boolean>;
    };

    const routes = defineRoutes((app) => [
      app.get('/', async (request) => {
        expectTypeOf(request).toEqualTypeOf<
          CustomRequest<'GET', never> & Context
        >();
        expectTypeOf(request.method).toEqualTypeOf<'GET'>();
        expectTypeOf(request.token).toEqualTypeOf<string>();
        expectTypeOf(request.getToken()).toEqualTypeOf<string>();
        expectTypeOf(request.authenticate()).toEqualTypeOf<Promise<boolean>>();
        return {};
      }),
      app.get('/foo/:id/bar/:type', async (request) => {
        type Params = { id: string; type: string };
        expectTypeOf(request.params).toEqualTypeOf<Params>();
        type Param = keyof Params;
        expectTypeOf(request).toEqualTypeOf<
          CustomRequest<'GET', Param> & Context
        >();
        expectTypeOf(request.token).toEqualTypeOf<string>();
        return {};
      }),
    ]);
    expectTypeOf(routes).toEqualTypeOf<Array<Route<Context>>>();
  });

  it('should enforce valid return value from route handler', () => {
    const { defineRoutes } = createApplication();
    const routes = defineRoutes((app) => [
      // It should allow us to omit return, or otherwise return void
      app.get('/', (_request) => {}),
      app.get('/', async (_request) => {}),
      app.post('/', async (_request) => {
        return;
      }),
      // It should allow us to return undefined
      app.post('/', async (_request) => undefined),
      // It should allow us to return null
      app.post('/', async (_request) => null),
      // It should not allow us to return a number
      // @ts-expect-error Type 'number' is not assignable to type 'Response | StaticFile | JsonPayload | null | undefined'
      app.post('/', async (_request) => 5),
      // It should not allow us to return a string
      // @ts-expect-error Type 'string' is not assignable to type 'Response | StaticFile | JsonPayload | null | undefined'
      app.post('/', async (_request) => 'x'),
      // It should not allow us to return a boolean
      // @ts-expect-error Type 'boolean' is not assignable to type 'Response | StaticFile | JsonPayload | null | undefined'
      app.post('/', async (_request) => false),
      // It should allow us to return an array
      app.post('/', async (_request) => []),
      // It should allow us to return an object
      app.post('/', async (_request) => ({})),
      // It should allow us to return an instance of Response
      app.post('/', async (_request) => new Response('')),
      app.post('/', async (_request) => Response.json('foo')),
      // It should allow us to return an instance of StaticFile
      app.post('/', async (_request) => CustomResponse.file('/foo.txt')),
    ]);
    expectTypeOf(routes).toEqualTypeOf<Array<Route<undefined>>>();
  });
});
