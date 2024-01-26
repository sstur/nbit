/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  RequestOptions,
  FileServingOptions,
  Handler,
  Route,
  Expand,
  MaybePromise,
  ResponseOptions,
  Method,
  LooseUnion,
} from '../types';
import { type Request, Response } from '../web-io';

import { createRouter } from './Router';
import { HttpError } from './HttpError';
import { CustomRequest } from './CustomRequest';
import { StaticFile } from './StaticFile';
import { defineErrors } from './support/defineErrors';

const Errors = defineErrors({
  StringifyError:
    'Failed to stringify value returned from route handler: {route}',
});

type ResponseTransformer = (response: Response) => Response | undefined;

class RequestEvent {
  constructor(
    public request: Request,
    private responseTransformers: Array<ResponseTransformer>,
  ) {}

  addListener(key: 'response', listener: ResponseTransformer) {
    this.responseTransformers.push(listener);
  }
}

class RouteMatchEvent {
  route: {
    method: string;
    pattern: string;
    params: Record<string, string>;
  };

  constructor(
    public request: Request,
    private responseTransformers: Array<ResponseTransformer>,
    route: [method: string, pattern: string],
    params: Record<string, string>,
  ) {
    const [method, pattern] = route;
    this.route = { method, pattern, params };
  }

  addListener(key: 'response', listener: ResponseTransformer) {
    this.responseTransformers.push(listener);
  }
}

type Options<CtxGetter> = Expand<
  RequestOptions &
    ResponseOptions &
    FileServingOptions & {
      onRequest?: (event: RequestEvent) => void;
      onRouteMatch?: (event: RouteMatchEvent) => void;
      /**
       * An optional way to define extra context (e.g. an auth method) that will
       * be added to each Request instance.
       */
      getContext?: CtxGetter;
    }
>;

type ContextGetter = (request: Request) => object | undefined;

type Adapter<NativeHandler> = {
  onError: (request: Request, error: Error) => MaybePromise<Response>;
  toResponse: (
    request: Request,
    result: Response | StaticFile | undefined,
  ) => MaybePromise<Response | undefined>;
  createNativeHandler: (
    requestHandler: (request: Request) => Promise<Response>,
  ) => NativeHandler;
};

type AnyFunction = (...args: Array<any>) => any;

type AdapterCreator<NativeHandler extends AnyFunction> = <
  CtxGetter extends ContextGetter,
>(
  applicationOptions: Options<CtxGetter>,
) => Adapter<NativeHandler>;

export function defineAdapter<NativeHandler extends AnyFunction>(
  createAdapter: AdapterCreator<NativeHandler>,
) {
  const createApplication = <
    CtxGetter extends ContextGetter = (request: Request) => undefined,
  >(
    applicationOptions: Options<CtxGetter> = {},
  ) => {
    const { getContext, onRequest, onRouteMatch, errorHandler } =
      applicationOptions;
    type RequestContext = ReturnType<CtxGetter>;
    const app = getApp<RequestContext>();
    type App = typeof app;

    const adapter = createAdapter(applicationOptions);

    const defineRoutes = (
      fn: (app: App) => Array<Route<RequestContext>>,
    ): Array<Route<RequestContext>> => fn(app);

    const createRequestHandler = (
      ...routeLists: Array<Array<Route<RequestContext>>>
    ) => {
      const router = createRouter<any>();
      for (const routeList of routeLists) {
        for (const [method, pattern, handler] of routeList) {
          router.insert(method, pattern, handler);
        }
      }
      const routeRequest = async (request: Request) => {
        const responseTransformers: Array<ResponseTransformer> = [];
        const context = getContext?.(request);
        if (onRequest) {
          const event = new RequestEvent(request, responseTransformers);
          onRequest(event);
        }
        const customRequest = new CustomRequest(request);
        if (context) {
          Object.assign(customRequest, context);
        }
        const { method, path } = customRequest;
        const matches = router.getMatches(method, path);
        for (const [handler, captures, route] of matches) {
          if (onRouteMatch) {
            const event = new RouteMatchEvent(
              request,
              responseTransformers,
              route,
              captures,
            );
            onRouteMatch(event);
          }
          Object.assign(customRequest, { params: captures });
          const result = await handler(customRequest);
          if (result !== undefined) {
            let resolvedResponse: Response | StaticFile;
            if (result instanceof Response || result instanceof StaticFile) {
              resolvedResponse = result;
            } else {
              try {
                resolvedResponse = Response.json(result);
              } catch (e) {
                const [method, pattern] = route;
                throw new Errors.StringifyError(
                  { route: `${method}:${pattern}` },
                  { cause: toError(e) },
                );
              }
            }
            const maybeResponse = await adapter.toResponse(
              request,
              resolvedResponse,
            );
            if (maybeResponse !== undefined) {
              let response = maybeResponse;
              for (const responseTransformer of responseTransformers) {
                const newResponse = responseTransformer(response);
                if (newResponse !== undefined) {
                  response = newResponse;
                }
              }
              return response;
            }
            return maybeResponse;
          }
        }
        return await adapter.toResponse(request, undefined);
      };
      return async (request: Request): Promise<Response> => {
        try {
          const response = await routeRequest(request);
          if (response) {
            return response;
          }
        } catch (e) {
          if (e instanceof HttpError) {
            const { status, message } = e;
            // TODO: Support a custom renderer from applicationOptions
            return new Response(message, { status });
          }
          const error = toError(e);
          if (errorHandler) {
            try {
              return await errorHandler(error);
            } catch (e) {
              return await adapter.onError(request, toError(e));
            }
          }
          return await adapter.onError(request, error);
        }
        // TODO: Support a custom 404 renderer from applicationOptions
        return new Response('Not found', { status: 404 });
      };
    };

    const attachRoutes = (
      ...routeLists: Array<Array<Route<RequestContext>>>
    ) => {
      const handleRequest = createRequestHandler(...routeLists);
      return adapter.createNativeHandler(handleRequest);
    };

    return { defineRoutes, createRequestHandler, attachRoutes };
  };

  return createApplication;
}

// Using exclude here to flatten for readability
type MethodOrWildcard = Exclude<Method | '*', ''>;

type MethodOrWildcardOrString = LooseUnion<MethodOrWildcard>;

function getApp<RequestContext>() {
  return {
    get: <P extends string>(
      path: P,
      handler: Handler<'GET', P, RequestContext>,
    ) => ['GET', path as string, handler] as Route<RequestContext>,
    post: <P extends string>(
      path: P,
      handler: Handler<'POST', P, RequestContext>,
    ) => ['POST', path as string, handler] as Route<RequestContext>,
    put: <P extends string>(
      path: P,
      handler: Handler<'PUT', P, RequestContext>,
    ) => ['PUT', path as string, handler] as Route<RequestContext>,
    delete: <P extends string>(
      path: P,
      handler: Handler<'DELETE', P, RequestContext>,
    ) => ['DELETE', path as string, handler] as Route<RequestContext>,
    route: <M extends MethodOrWildcardOrString, P extends string>(
      method: M,
      path: P,
      handler: Handler<Uppercase<M>, P, RequestContext>,
    ) =>
      [method.toUpperCase(), path as string, handler] as Route<RequestContext>,
  };
}

function toError(e: unknown) {
  return e instanceof Error ? e : new Error(String(e));
}
