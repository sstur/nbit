import path from 'path';

import type {
  Express,
  Request as ExpressRequest,
  Response as ExpressResponse,
  RequestHandler as ExpressHandler,
  NextFunction,
} from 'express';

import { Request } from './Request';
import { isStream, isStaticFile, Response } from './Response';
import { HttpError } from './HttpError';
import type { Handler, Method, Route } from './types';

const weakMap = new WeakMap<ExpressRequest, Request<Method, string>>();

type Options = {
  /** The root from which file names will be resolved when serving files */
  root: string;
  /**
   * An array of paths (relative to root) from which static files are _allowed_
   * to be served. For now this only supports a single path.
   */
  allowStaticFrom: [string];
};

export function createApplication(options: Options) {
  const projectRoot = path.resolve(options.root);
  const allowedRoot = path.join(projectRoot, options.allowStaticFrom[0]);

  const attachRoutes = (app: Express, routes: Array<Route>) => {
    for (let [method, path, handler] of routes) {
      attach(app, method, path, toExpressHandler(handler));
    }
  };

  const toExpressHandler = (handler: Handler<Method, string>) => {
    return async (
      expressRequest: ExpressRequest,
      expressResponse: ExpressResponse,
      next: NextFunction,
    ) => {
      // Use WeakMap to ensure only one Request instance is created per instance
      // of ExpressRequest
      const request =
        weakMap.get(expressRequest) ||
        new Request(expressRequest, expressResponse);
      weakMap.set(expressRequest, request);
      try {
        const result = await handler(request);
        if (result) {
          // TODO: If result is an object containing a circular reference, this
          // next line will throw, resulting in a 500 response with no
          // indication of which handler caused it.
          const response =
            result instanceof Response ? result : Response.json(result);
          send(response, expressRequest, expressResponse, next);
        } else {
          next();
        }
      } catch (error) {
        if (error instanceof HttpError) {
          const response = new Response(error.message, {
            status: error.status,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
          send(response, expressRequest, expressResponse, next);
        } else {
          next(error);
        }
      }
    };
  };

  const send = (
    response: Response,
    expressRequest: ExpressRequest,
    expressResponse: ExpressResponse,
    next: NextFunction,
  ) => {
    const { status, headers, body } = response;
    expressResponse.status(status);
    if (isStaticFile(body)) {
      // Resolve the file path relative to the project root.
      const fullFilePath = path.join(projectRoot, body.filePath);
      expressResponse.sendFile(
        // For Express, pass the file path relative to allowedRoot. Express will
        // not serve the file if it does not exist within the allowed root.
        path.relative(allowedRoot, fullFilePath),
        {
          root: allowedRoot,
          headers,
        },
        next,
      );
    } else if (isStream(body)) {
      expressResponse.set(headers);
      body.pipe(expressResponse);
    } else {
      expressResponse.set(headers);
      if (body != null) {
        expressResponse.write(body);
      }
      expressResponse.end();
    }
  };

  return { attachRoutes };
}

function attach(
  app: Express,
  method: Method,
  path: string,
  handler: ExpressHandler,
) {
  switch (method) {
    case 'GET': {
      app.get(path, handler);
      break;
    }
    case 'POST': {
      app.post(path, handler);
      break;
    }
    case 'PUT': {
      app.put(path, handler);
      break;
    }
    case 'DELETE': {
      app.delete(path, handler);
      break;
    }
  }
}
