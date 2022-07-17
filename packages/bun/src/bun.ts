import { createCreateApplication, HttpError, type Router } from './core';
import { Request } from './Request';
import { Response } from './Response';
import type { Method } from './types';
import type { Request as BaseRequest } from './builtins';
import { toNativeResponse } from './support/toNativeResponse';

function createWrappedRequest<M extends Method, Params extends string>(
  baseRequest: BaseRequest,
  params: Record<Params, string>,
): Request<M, Params> {
  // TODO: This probably shouldn't be necessary.
  Object.setPrototypeOf(baseRequest, Request.prototype);
  const { url } = baseRequest;
  const { pathname, search, searchParams } = new URL(url);
  Object.assign(baseRequest, {
    path: pathname,
    search,
    query: searchParams,
    params,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return baseRequest as any;
}

async function routeRequest<T>(
  router: Router<T>,
  baseRequest: BaseRequest,
  getContext?: (request: Request<Method, string>) => object | undefined,
): Promise<Response> {
  const { method, url } = baseRequest;
  const { pathname } = new URL(url);
  try {
    const result = await router.route(method, pathname, (captures) => {
      const request = createWrappedRequest(
        baseRequest,
        Object.fromEntries(captures),
      );
      const context = getContext?.(request);
      const requestWithContext =
        context === undefined ? request : Object.assign(request, context);
      return requestWithContext as unknown as T;
    });
    if (result === undefined) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    }
    // TODO: If result is an object containing a circular reference, this
    // next line will throw, resulting in a 500 response with no
    // indication of which handler caused it.
    return result instanceof Response ? result : Response.json(result);
  } catch (e) {
    if (e instanceof HttpError) {
      return new Response(e.message, {
        status: e.status,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    } else {
      return new Response(String(e), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    }
  }
}

export const createApplication = createCreateApplication(
  (router, getContext) => {
    return async (request: BaseRequest) => {
      const response = await routeRequest(router, request, getContext);
      return toNativeResponse(response);
    };
  },
);
