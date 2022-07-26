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
import { resolveFilePath } from './core/support/resolveFilePath';
import { isReadable, toReadStream } from './support/streams';
import { Headers } from './Headers';

export const createApplication = createCreateApplication(
  (router, applicationOptions) => {
    const { getContext } = applicationOptions;

    // TODO: Rename this to processRequest or getResponse?
    const routeRequest = async (
      expressRequest: ExpressRequest,
      headers: Headers,
    ): Promise<Response | StaticFile | Error | undefined> => {
      const method = (expressRequest.method ?? 'GET').toUpperCase();
      const pathname = expressRequest.url ?? '/';

      const toResponse = async (input: unknown) => {
        if (input instanceof Response || input instanceof StaticFile) {
          return input;
        }
        return Response.json(input);
      };

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
          // TODO: Move this outside the loop and use await
          const context = getContext?.(request);
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
      };

      try {
        return await getResult();
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
      if (response instanceof StaticFile) {
        const { filePath, options, responseInit: init } = response;
        const { cachingHeaders = true, maxAge } = options;
        // Resolve the file path relative to the project root.
        const resolved = resolveFilePath(filePath, applicationOptions);
        if (!resolved) {
          // TODO: Better error
          expressResponse.writeHead(403);
          expressResponse.end('Unable to serve file');
          return;
        }
        const [fullFilePath, allowedRoot] = resolved;
        expressResponse.status(init.status ?? 200);
        expressResponse.sendFile(
          // For Express, pass the file path relative to allowedRoot. Express will
          // not serve the file if it does not exist within the allowed root.
          relative(allowedRoot, fullFilePath),
          {
            root: allowedRoot,
            headers: new Headers(init.headers).toNodeHeaders(),
            // Note: Express always sends the ETag header
            lastModified: cachingHeaders,
            maxAge: typeof maxAge === 'number' ? maxAge * 1000 : undefined,
          },
          next,
        );
        return;
      }
      const { status, statusText, headers, body } = response;
      if (isReadable(body)) {
        expressResponse.writeHead(status, statusText, headers.toNodeHeaders());
        toReadStream(body).pipe(expressResponse);
      } else {
        expressResponse.writeHead(status, statusText, headers.toNodeHeaders());
        if (body != null) {
          expressResponse.write(body);
        }
        expressResponse.end();
      }
    };
  },
);
