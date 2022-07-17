import path from 'path';
import { Readable } from 'stream';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { createCreateApplication, HttpError } from './core';
import { isStaticFile, Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './support/resolveFilePath';
import { isReadStream, isWebStream } from './support/streams';

export const createApplication = createCreateApplication((router, options) => {
  const { getContext } = options;

  const routeRequest = async (
    expressRequest: ExpressRequest,
  ): Promise<Response | Error | null> => {
    const method = (expressRequest.method ?? 'GET').toUpperCase();
    const path = expressRequest.url ?? '/';
    try {
      const result = await router.route(method, path, (captures) => {
        const request = new Request(
          expressRequest,
          Object.fromEntries(captures),
        );
        const context = getContext?.(request);
        const requestWithContext =
          context === undefined ? request : Object.assign(request, context);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return requestWithContext as any;
      });
      if (result === undefined) {
        return null;
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
        return e instanceof Error ? e : new Error(String(e));
      }
    }
  };

  return async (
    expressRequest: ExpressRequest,
    expressResponse: ExpressResponse,
    next: NextFunction,
  ) => {
    const response = await routeRequest(expressRequest);
    if (!response) {
      return next();
    }
    if (response instanceof Error) {
      return next(response);
    }
    const { status, headers, body } = response;
    if (isStaticFile(body)) {
      // Resolve the file path relative to the project root.
      const { filePath } = body;
      const resolved = resolveFilePath(filePath, options);
      if (!resolved) {
        // TODO: Better error
        expressResponse.writeHead(403);
        expressResponse.end('Unable to serve file');
        return;
      }
      const [fullFilePath, allowedRoot] = resolved;
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
    } else if (isReadStream(body)) {
      expressResponse.writeHead(status, headers);
      body.pipe(expressResponse);
    } else if (isWebStream(body)) {
      expressResponse.writeHead(status, headers);
      Readable.fromWeb(body).pipe(expressResponse);
    } else {
      expressResponse.writeHead(status, headers);
      if (body != null) {
        expressResponse.write(body);
      }
      expressResponse.end();
    }
  };
});
