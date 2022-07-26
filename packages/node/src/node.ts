import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable, Writable } from 'stream';

import { createCreateApplication, HttpError } from './core';
import { Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './fs';
import { isReadable, toReadStream } from './support/streams';
import { serveFile } from './support/serveFile';
import { Headers } from './Headers';
import { StaticFile } from './core/StaticFile';

// TODO: `router` here is Router<any>, can we do better?
export const createApplication = createCreateApplication(
  (router, applicationOptions) => {
    const { getContext } = applicationOptions;

    // TODO: Rename this to processRequest or getResponse?
    const routeRequest = async (
      nodeRequest: IncomingMessage,
      headers: Headers,
    ): Promise<Response> => {
      const method = (nodeRequest.method ?? 'GET').toUpperCase();
      const pathname = nodeRequest.url ?? '/';

      // TODO: Factor out the following 3 functions?
      const fromStaticFile = async (
        file: StaticFile,
      ): Promise<Response | undefined> => {
        const { filePath, options, responseInit: init } = file;
        const resolved = resolveFilePath(filePath, applicationOptions);
        if (!resolved) {
          return;
        }
        const [fullFilePath] = resolved;
        const fileResponse = await serveFile(headers, fullFilePath, options);
        if (!fileResponse) {
          return;
        }
        // Use the status from fileResponse if provided (e.g. "304 Not Modified")
        // otherwise fall back to user-specified value or default.
        const responseStatus = fileResponse.status ?? init.status ?? 200;
        const responseHeaders = new Headers(init.headers);
        // Merge in the headers without overwriting existing headers
        for (const [key, value] of Object.entries(fileResponse.headers ?? {})) {
          if (!responseHeaders.has(key)) {
            responseHeaders.set(key, value);
          }
        }
        return new Response(fileResponse.body ?? '', {
          ...init,
          status: responseStatus,
          headers: responseHeaders,
        });
      };

      const toResponse = async (input: unknown) => {
        if (input instanceof Response) {
          return input;
        }
        if (input instanceof StaticFile) {
          return await fromStaticFile(input);
        }
        return Response.json(input);
      };

      // TODO: Factor this getResult up into core? Would need the old approach of Captures -> Request
      const getResult = async () => {
        const matches = router.getMatches(method, pathname);
        for (const [handler, captures] of matches) {
          const request = new Request(
            nodeRequest,
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
        return undefined;
      };

      try {
        const result = await getResult();
        if (result === undefined) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        }
        return result;
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
    };

    const handleNodeRequest = async (
      nodeRequest: IncomingMessage,
      nodeResponse: ServerResponse,
    ) => {
      const requestHeaders = Headers.fromNodeRawHeaders(nodeRequest.rawHeaders);
      const response = await routeRequest(nodeRequest, requestHeaders);
      const { status, statusText, headers, body } = response;
      if (isReadable(body)) {
        const readStream = toReadStream(body);
        await pipeStreamAsync(readStream, nodeResponse, {
          beforeFirstWrite: () =>
            nodeResponse.writeHead(status, statusText, headers.toNodeHeaders()),
        });
      } else {
        nodeResponse.writeHead(status, statusText, headers.toNodeHeaders());
        if (body != null) {
          nodeResponse.write(body);
        }
        nodeResponse.end();
      }
    };

    return (nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
      handleNodeRequest(nodeRequest, nodeResponse).catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        if (!nodeResponse.headersSent) {
          nodeResponse.writeHead(500);
          nodeResponse.end(String(error));
        } else {
          nodeResponse.end();
        }
      });
    };
  },
);

function pipeStreamAsync(
  readStream: Readable,
  writeStream: Writable,
  options: { beforeFirstWrite: () => void },
): Promise<void> {
  const { beforeFirstWrite } = options;
  return new Promise((resolve, reject) => {
    readStream
      .once('data', beforeFirstWrite)
      .pipe(writeStream)
      .on('close', () => resolve())
      .on('error', (error) => {
        readStream.off('data', beforeFirstWrite);
        reject(error);
      });
  });
}
