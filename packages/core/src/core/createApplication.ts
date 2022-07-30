/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  RequestOptions,
  FileServingOptions,
  Handler,
  Route,
  Expand,
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

type RequestHandler = <Res, ErrRes>(
  request: Request,
  params: {
    onError: (error: Error) => ErrRes;
    toResponse: (result: unknown) => Promise<Res>;
  },
) => Promise<Res | ErrRes | undefined>;

type NativeHandlerCreator<NativeHandler> = <CtxGetter extends ContextGetter>(
  requestHandler: RequestHandler,
  options: Options<CtxGetter>,
) => NativeHandler;

export function createCreateApplication<NativeHandler>(
  createNativeHandler: NativeHandlerCreator<NativeHandler>,
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

    const defineRoutes = (
      fn: (app: App) => Array<Route<RequestContext>>,
    ): Array<Route<RequestContext>> => fn(app);

    const attachRoutes = (
      ...routeLists: Array<Array<Route<RequestContext>>>
    ) => {
      const router = createRouter<any>();
      for (const routeList of routeLists) {
        for (const [method, pattern, handler] of routeList) {
          router.insert(method, pattern, handler);
        }
      }

      const requestHandler: RequestHandler = async (
        request,
        { onError, toResponse },
      ) => {
        const getResult = async () => {
          // TODO: Should we use await here?
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
      return createNativeHandler(requestHandler, applicationOptions);
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
