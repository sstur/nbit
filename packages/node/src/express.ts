import { relative } from 'path';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { createCreateApplication, HttpError } from './core';
import { StaticFile } from './core/StaticFile';
import { Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './support/resolveFilePath';
import { isReadable, toReadStream } from './support/streams';
import { Headers } from './Headers';

export const createApplication = createCreateApplication(
  (router, applicationOptions) => {
    const { getContext } = applicationOptions;

    // TODO: Rename this to processRequest or getResponse?
    const routeRequest = async (
      expressRequest: ExpressRequest,
      headers: Headers,
    ): Promise<Response | Error | null> => {
      const method = (expressRequest.method ?? 'GET').toUpperCase();
      const pathname = expressRequest.url ?? '/';
      // TODO: Factor this getResult up into core? Would need the old approach of Captures -> Request
      const getResult = async () => {
        const matches = router.getMatches(method, pathname);
        for (const [handler, captures] of matches) {
          const request = new Request(
            expressRequest,
            headers,
            captures,
            applicationOptions,
          );
          const context = getContext?.(request);
          const requestWithContext =
            context === undefined ? request : Object.assign(request, context);
          const result = handler(requestWithContext);
          if (result !== undefined) {
            return result;
          }
        }
      };
      try {
        const result = await getResult();
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
      const requestHeaders = Headers.fromNodeRawHeaders(
        expressRequest.rawHeaders,
      );
      const response = await routeRequest(expressRequest, requestHeaders);
      if (!response) {
        return next();
      }
      if (response instanceof Error) {
        return next(response);
      }
      response.body;
      const { status, headers, body } = response;
      if (body instanceof StaticFile) {
        // TODO: options.cachingHeaders/maxAge; init.status/headers
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { filePath, options, responseInit: init } = body;
        // Resolve the file path relative to the project root.
        const resolved = resolveFilePath(filePath, applicationOptions);
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
          relative(allowedRoot, fullFilePath),
          {
            root: allowedRoot,
            headers,
          },
          next,
        );
      } else if (isReadable(body)) {
        expressResponse.writeHead(status, headers.toNodeHeaders());
        toReadStream(body).pipe(expressResponse);
      } else {
        expressResponse.writeHead(status, headers.toNodeHeaders());
        if (body != null) {
          expressResponse.write(body);
        }
        expressResponse.end();
      }
    };
  },
);
