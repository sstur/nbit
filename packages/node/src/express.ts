import { relative } from 'path';
import { Readable } from 'stream';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

import { defineAdapter } from './core';
import { StaticFile } from './core/StaticFile';
import { createMeta } from './core/support/createMeta';
import { defineErrors } from './core/support/defineErrors';
import { Response, Headers } from './web-io';
import { resolveFilePath } from './fs';
import { pipeStreamAsync } from './support/pipeStreamAsync';
import { toNodeHeaders } from './support/headers';
import { fromNodeRequest } from './support/fromNodeRequest';

type ExpressStaticFileOpts = {
  root: string;
  headers: Record<string, string | Array<string>>;
  lastModified: boolean;
  maxAge: number | undefined;
};

// This is roughly the params needed for Express's res.sendFile()
type ExpressStaticFile = [
  status: number,
  path: string,
  options: ExpressStaticFileOpts,
];

const Errors = defineErrors({
  // This is a placeholder for when no route matches so we can easily identify
  // it as a special case of error and hand control over to Express.
  NoRouteError: 'No Route',
});

export const createApplication = defineAdapter((applicationOptions) => {
  const [getExpressStaticFile, setExpressStaticFile] =
    createMeta<ExpressStaticFile>();
  const [getError, setError] = createMeta<Error>();

  const fromStaticFile = async (
    requestHeaders: Headers,
    staticFile: StaticFile,
  ): Promise<Response | undefined> => {
    const { filePath, options, responseInit: init } = staticFile;
    const resolved = resolveFilePath(filePath, applicationOptions);
    if (!resolved) {
      return;
    }
    const [fullFilePath, allowedRoot] = resolved;
    const customServeFile = applicationOptions.serveFile;
    if (customServeFile) {
      const { status, statusText, headers } = new Response(null, init);
      const maybeResponse = await customServeFile({
        filePath,
        fullFilePath,
        status,
        statusText,
        headers,
        options,
      });
      return maybeResponse ?? undefined;
    }

    const { cachingHeaders = true, maxAge } = options;
    const response = new Response(filePath);
    setExpressStaticFile(response, [
      init.status ?? 200,
      // Pass the file path relative to allowedRoot. Express will not
      // serve the file if it does not exist within the allowed root.
      relative(allowedRoot, fullFilePath),
      {
        root: allowedRoot,
        headers: toNodeHeaders(new Headers(init.headers)),
        // Note: Express always sends the ETag header
        lastModified: cachingHeaders,
        maxAge: typeof maxAge === 'number' ? maxAge * 1000 : undefined,
      },
    ]);
    return response;
  };

  return {
    onError: (request, error) => {
      // We're creating a dummy response here and keeping a reference to the
      // error for use below.
      const response = new Response(String(error), { status: 500 });
      setError(response, error);
      return response;
    },
    toResponse: async (request, result) => {
      if (result instanceof StaticFile) {
        return await fromStaticFile(request.headers, result);
      }
      if (result === undefined) {
        // In the other implementations we return undefined here, causing the
        // calling function to create a 404 response. But in this case we're
        // throwing a special NoRouteError which will be sent to the onError
        // function above, which will use a separate trick to pass the error to
        // handleRequest below where we can call Express's next().
        throw new Errors.NoRouteError();
      }
      return result;
    },
    createNativeHandler: (getResponse) => {
      const handleRequest = async (
        expressRequest: ExpressRequest,
        expressResponse: ExpressResponse,
        next: NextFunction,
      ) => {
        const request = fromNodeRequest(expressRequest, applicationOptions);
        const response = await getResponse(request);
        const error = getError(response);
        if (error) {
          return error instanceof Errors.NoRouteError ? next() : next(error);
        }
        const staticFile = getExpressStaticFile(response);
        if (staticFile) {
          const [status, path, options] = staticFile;
          expressResponse.status(status);
          expressResponse.sendFile(path, options, next);
          return;
        }
        const { status, statusText, headers, bodyRaw: body } = response;
        if (body instanceof Readable) {
          await pipeStreamAsync(body, expressResponse, {
            beforeFirstWrite: () =>
              expressResponse.writeHead(
                status,
                statusText,
                toNodeHeaders(headers),
              ),
          });
        } else {
          expressResponse.writeHead(status, statusText, toNodeHeaders(headers));
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
