import type {
  FileServingOptions,
  Handler,
  MaybeIntersect,
  Method,
  Route,
} from '../types';
import type { Request } from '../Request';

import { Router } from './Router';

type Options<CtxGetter> = FileServingOptions & {
  /**
   * An optional way to define extra context (e.g. an auth method) that will be
   * added to each Request instance.
   */
  getContext?: CtxGetter;
};

type ContextGetter = (request: Request<Method, string>) => object | undefined;

type RequestHandlerCreator<RequestHandler> = <
  ReqWithCtx,
  CtxGetter extends ContextGetter,
>(
  router: Router<ReqWithCtx>,
  options: Options<CtxGetter>,
) => RequestHandler;

export function createCreateApplication<RequestHandler>(
  createRequestHandler: RequestHandlerCreator<RequestHandler>,
) {
  const createApplication = <
    CtxGetter extends ContextGetter = (
      request: Request<Method, string>,
    ) => undefined,
  >(
    options: Options<CtxGetter> = {},
  ) => {
    type RequestContext = ReturnType<CtxGetter>;
    const app = getApp<RequestContext>();
    type App = typeof app;
    type RequestWithContext = MaybeIntersect<
      Request<Method, string>,
      RequestContext
    >;
    const defineRoutes = (
      fn: (app: App) => Array<Route<RequestContext>>,
    ): Array<Route<RequestContext>> => fn(app);
    const attachRoutes = (
      ...routeLists: Array<Array<Route<RequestContext>>>
    ) => {
      const router = new Router<RequestWithContext>();
      for (const routeList of routeLists) {
        for (const [method, pattern, handler] of routeList) {
          router.attachRoute(method, pattern, handler);
        }
      }
      return createRequestHandler(router, options);
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
