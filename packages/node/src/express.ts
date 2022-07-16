import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { createCreateApplication, HttpError, type Router } from './core';
import { isStaticFile, Response } from './Response';
import { Request } from './Request';
import type { Method } from './types';

function createExpressMiddleware<T>(
  router: Router<T>,
  getContext?: (request: Request<Method, string>) => object | undefined,
) {
  return async (
    expressRequest: ExpressRequest,
    expressResponse: ExpressResponse,
    next: NextFunction,
  ) => {
    const response = await routeRequest(router, expressRequest, getContext);
    if (!response) {
      return next();
    }
    if (response instanceof Error) {
      return next(response);
    }
    const { status, headers, body } = response;
    if (isStaticFile(body)) {
      // TODO: Send file
      expressResponse.writeHead(500);
      expressResponse.end('Error: File serving not yet implemented');
    }
    // else if (body instanceof ReadableStream) {
    //   expressResponse.writeHead(status, headers);
    //   body.pipe(expressResponse);
    // }
    else {
      expressResponse.writeHead(status, headers);
      if (body != null) {
        expressResponse.write(body);
      }
      expressResponse.end();
    }
  };
}

async function routeRequest<T>(
  router: Router<T>,
  expressRequest: ExpressRequest,
  getContext?: (request: Request<Method, string>) => object | undefined,
): Promise<Response | Error | null> {
  const method = (expressRequest.method ?? 'GET').toUpperCase();
  const path = expressRequest.url ?? '/';
  try {
    const result = await router.route(method, path, (captures) => {
      const request = new Request(expressRequest, Object.fromEntries(captures));
      const context = getContext?.(request);
      const requestWithContext =
        context === undefined ? request : Object.assign(request, context);
      return requestWithContext as unknown as T;
    });
    if (result) {
      // TODO: If result is an object containing a circular reference, this
      // next line will throw, resulting in a 500 response with no
      // indication of which handler caused it.
      return result instanceof Response ? result : Response.json(result);
    } else {
      return null;
    }
  } catch (e) {
    if (e instanceof HttpError) {
      return new Response(e.message, {
        status: e.status,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    } else {
      return e instanceof Error ? e : new Error(String(e));
    }
  }
}

export const createApplication = createCreateApplication(
  createExpressMiddleware,
);
