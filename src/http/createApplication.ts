import { Router } from './Router';
import { type Request } from './Request';
import type { Handler, Route, MaybeIntersect, Method } from './types';

type Options<T> = {
  /** The root from which file names will be resolved when serving files */
  root?: string;
  /**
   * An array of paths (relative to root) from which static files are _allowed_
   * to be served. For now this only supports a single path.
   */
  allowStaticFrom?: [string];
  /**
   * An optional way to define extra context (e.g. an auth method) that will be
   * added to each Request instance.
   */
  getContext?: T;
};

type ContextGetter = (request: Request<Method, string>) => object | undefined;

type RequestHandlerCreator<RequestHandler> = <T>(
  router: Router<T>,
  getContext?: ContextGetter,
) => RequestHandler;

export function createCreateApplication<RequestHandler>(
  createRequestHandler: RequestHandlerCreator<RequestHandler>,
) {
  const createApplication = <
    T extends (request: Request<Method, string>) => object | undefined = (
      request: Request<Method, string>,
    ) => undefined,
  >(
    options: Options<T> = {},
  ) => {
    const { getContext } = options;
    type RequestContext = ReturnType<T>;
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
      return createRequestHandler(router, getContext);
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
