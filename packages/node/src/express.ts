import { relative } from 'path';
import type { IncomingMessage } from 'http';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { createCreateApplication } from './core';
import { StaticFile } from './core/StaticFile';
import { Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './fs';
import { isReadable, toReadStream } from './support/streams';
import { Headers } from './Headers';

export const createApplication = createCreateApplication(
  (routeRequest, applicationOptions) => {
    const getResponse = async (nodeRequest: IncomingMessage) => {
      const method = (nodeRequest.method ?? 'GET').toUpperCase();
      const pathname = nodeRequest.url ?? '/';
      const headers = Headers.fromNodeRawHeaders(nodeRequest.rawHeaders);
      return await routeRequest({
        method,
        pathname,
        instantiateRequest: (captures) => {
          return new Request(
            nodeRequest,
            headers,
            captures,
            applicationOptions,
          );
        },
        onError: (error) => error,
        toResponse: async (input) => {
          if (input instanceof Response || input instanceof StaticFile) {
            return input;
          }
          return Response.json(input);
        },
      });
    };

    return async (
      expressRequest: ExpressRequest,
      expressResponse: ExpressResponse,
      next: NextFunction,
    ) => {
      const response = await getResponse(expressRequest);
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
