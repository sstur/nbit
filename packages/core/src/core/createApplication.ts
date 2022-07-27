/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  RequestOptions,
  FileServingOptions,
  Handler,
  Method,
  Route,
  Expand,
} from '../types';
import { type Request, Response } from '../applicationTypes';

import { createRouter } from './Router';
import { HttpError } from './HttpError';

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

type ContextGetter = (request: Request<Method, string>) => object | undefined;

type RouteRequestParams<Req, ErrRes, Res> = {
  method: string;
  pathname: string;
  instantiateRequest: (captures: Record<string, string>) => Req;
  onError: (error: Error) => ErrRes;
  toResponse: (result: unknown) => Promise<Res>;
};

type NativeHandlerCreator<NativeHandler> = <CtxGetter extends ContextGetter>(
  routeRequest: <Req, ErrRes, Res>(
    params: RouteRequestParams<Req, ErrRes, Res>,
  ) => Promise<Res | ErrRes | undefined>,
  options: Options<CtxGetter>,
) => NativeHandler;

export function createCreateApplication<NativeHandler>(
  createNativeHandler: NativeHandlerCreator<NativeHandler>,
) {
  const createApplication = <
    CtxGetter extends ContextGetter = (
      request: Request<Method, string>,
    ) => undefined,
  >(
    applicationOptions: Options<CtxGetter> = {},
  ) => {
    type RequestContext = ReturnType<CtxGetter>;
    const app = getApp<RequestContext>();
    type App = typeof app;

    const defineRoutes = (
      fn: (app: App) => Array<Route<RequestContext>>,
    ): Array<Route<RequestContext>> => fn(app);

    const attachRoutes = (
      ...routeLists: Array<Array<Route<RequestContext>>>
    ) => {
      const { getContext } = applicationOptions;

      const router = createRouter<any>();
      for (const routeList of routeLists) {
        for (const [method, pattern, handler] of routeList) {
          router.insert(method, pattern, handler);
        }
      }

      const routeRequest = async <Req, ErrRes, Res>({
        method,
        pathname,
        instantiateRequest,
        onError,
        toResponse,
      }: RouteRequestParams<Req, ErrRes, Res>) => {
        const getResult = async () => {
          const matches = router.getMatches(method, pathname);
          for (const [handler, captures] of matches) {
            const request = instantiateRequest(captures);
            // TODO: Move this outside the loop; decide if we should use await
            const context = getContext?.(request as any);
            const requestWithContext =
              context === undefined ? request : Object.assign(request, context);
            const result = await handler(requestWithContext);
            if (result !== undefined) {
              // TODO: If result is an object containing a circular reference, this
              // next line will throw. It might be useful to include some indicator
              // of which handler caused the error.
              return await toResponse(result);
            }
          }
          return undefined;
        };

        try {
          return await getResult();
        } catch (e) {
          if (e instanceof HttpError) {
            const { status, message } = e;
            return new Response(message, { status }) as any;
          } else {
            const error = e instanceof Error ? e : new Error(String(e));
            return onError(error);
          }
        }
      };

      return createNativeHandler(routeRequest, applicationOptions);
    };
    return { defineRoutes, attachRoutes };
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
