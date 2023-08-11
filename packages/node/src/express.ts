import { relative } from 'path';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { defineAdapter } from './core';
import { StaticFile } from './core/StaticFile';
import { defineErrors } from './core/support/defineErrors';
import { Response } from './Response';
import { resolveFilePath } from './fs';
import { isReadable } from './support/streams';
import { Headers } from './Headers';
import { Request } from './Request';
import { pipeStreamAsync } from './support/pipeStreamAsync';

const Errors = defineErrors({
  // This is a placeholder for when no route matches so we can easily identify
  // it as a special case of error and hand control over to Express.
  NoRouteError: 'No Route',
});

export const createApplication = defineAdapter((applicationOptions) => {
  // TODO: This is pretty hacky, consider a different approach.
  const toStaticFile = new WeakMap<Response, StaticFile>();
  const toError = new WeakMap<Response, Error>();

  return {
    onError: (request, error) => {
      // Hacky: We're creating a dummy response here and keeping a weakmap
      // reference to the error for use below.
      const response = new Response(String(error), { status: 500 });
      toError.set(response, error);
      return response;
    },
    toResponse: async (request, result) => {
      if (result instanceof StaticFile) {
        const staticFile = result;
        const customServeFile = applicationOptions.serveFile;
        if (customServeFile) {
          const { filePath, options, responseInit: init } = staticFile;
          const resolved = resolveFilePath(filePath, applicationOptions);
          if (resolved) {
            const [fullFilePath] = resolved;
            const { status, statusText, headers } = new Response(null, init);
            const maybeResponse = await customServeFile({
              filePath,
              fullFilePath,
              status,
              statusText,
              headers,
              options,
            });
            if (maybeResponse) {
              return maybeResponse;
            }
          }
          return new Response('Not found', { status: 404 });
        }
        // Hacky: We're creating a dummy response here and keeping a weakmap
        // reference to the StaticFile for use below.
        const response = new Response(staticFile.filePath);
        toStaticFile.set(response, staticFile);
        return response;
      }
      if (result instanceof Response) {
        return result;
      }
      if (result === undefined) {
        // In the other implementations we return a 404 Response here, but in
        // this case we're throwing a special NoRouteError to signal to the
        // calling function that control should be passed back to Express.
        // In practice, this error will first be sent to the onError function
        // above, which will use a separate trick to pass the error to
        // handleRequest below.
        throw new Errors.NoRouteError();
      }
      return Response.json(result);
    },
    createNativeHandler: (getResponse) => {
      const handleRequest = async (
        expressRequest: ExpressRequest,
        expressResponse: ExpressResponse,
        next: NextFunction,
      ) => {
        const request = Request.fromNodeRequest(
          expressRequest,
          applicationOptions,
        );
        const response = await getResponse(request);
        const error = toError.get(response);
        if (error) {
          return error instanceof Errors.NoRouteError ? next() : next(error);
        }
        const staticFile = toStaticFile.get(response);
        if (staticFile) {
          const { filePath, options, responseInit: init } = staticFile;
          const { cachingHeaders = true, maxAge } = options;
          // Resolve the file path relative to the project root.
          const resolved = resolveFilePath(filePath, applicationOptions);
          if (!resolved) {
            // For consistency with the other implementations, send a 404 here
            expressResponse.writeHead(404);
            expressResponse.end('Not found');
            return;
          }
          const [fullFilePath, allowedRoot] = resolved;
          expressResponse.status(init.status ?? 200);
          expressResponse.sendFile(
            // Pass the file path relative to allowedRoot. Express will not
            // serve the file if it does not exist within the allowed root.
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
        const { status, statusText, headers, bodyRaw: body } = response;
        if (isReadable(body)) {
          await pipeStreamAsync(body, expressResponse, {
            beforeFirstWrite: () =>
              expressResponse.writeHead(
                status,
                statusText,
                headers.toNodeHeaders(),
              ),
          });
        } else {
          expressResponse.writeHead(
            status,
            statusText,
            headers.toNodeHeaders(),
          );
          if (body != null) {
            expressResponse.write(body);
          }
          expressResponse.end();
        }
      };
      return (
        expressRequest: ExpressRequest,
        expressResponse: ExpressResponse,
        next: NextFunction,
      ) => {
        handleRequest(expressRequest, expressResponse, next).catch((e) => {
          const error = e instanceof Error ? e : new Error(String(e));
          // Normally we'd pass the error on to next() but in this case it seems
          // something went wrong with streaming so we'll end the request here.
          if (!expressResponse.headersSent) {
            expressResponse.writeHead(500);
            expressResponse.end(String(error));
          } else {
            expressResponse.end();
          }
        });
      };
    },
  };
});
