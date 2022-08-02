/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  RequestOptions,
  FileServingOptions,
  Handler,
  Route,
  Expand,
  MaybePromise,
} from '../types';
import { type Request, Response } from '../applicationTypes';

import { createRouter } from './Router';
import { HttpError } from './HttpError';
import CustomRequest from './CustomRequest';

type Options<CtxGetter> = Expand<
  RequestOptions &
    FileServingOptions & {
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
  toResponse: (request: Request, result: unknown) => MaybePromise<Response>;
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

export function createCreateApplication<NativeHandler extends AnyFunction>(
  // TODO: Rename this
  createAdapter: AdapterCreator<NativeHandler>,
) {
  const createApplication = <
    CtxGetter extends ContextGetter = (request: Request) => undefined,
  >(
    applicationOptions: Options<CtxGetter> = {},
  ) => {
    const { getContext } = applicationOptions;
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
        // TODO: Use await here?
        const context = getContext?.(request);
        const customRequest = new CustomRequest(request);
        if (context) {
          Object.assign(customRequest, context);
        }
        const { method, path } = customRequest;
        const matches = router.getMatches(method, path);
        for (const [handler, captures] of matches) {
          Object.assign(customRequest, { params: captures });
          const result = await handler(customRequest);
          if (result !== undefined) {
            // TODO: If result is an object containing a circular reference,
            // this next line will throw. It would be useful to include some
            // indication of which handler caused the error.
            return await adapter.toResponse(request, result);
          }
        }
        return adapter.toResponse(request, undefined);
      };
      return async (request: Request): Promise<Response> => {
        try {
          return await routeRequest(request);
        } catch (e) {
          if (e instanceof HttpError) {
            const { status, message } = e;
            return new Response(message, { status }) as any;
          } else {
            const error = e instanceof Error ? e : new Error(String(e));
            return adapter.onError(request, error);
          }
        }
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
  };
}
