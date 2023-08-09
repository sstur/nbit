import type { IncomingMessage, ServerResponse } from 'http';

import { defineAdapter } from './core';
import { Response } from './Response';
import { isReadable } from './support/streams';
import { StaticFile } from './core/StaticFile';
import { resolveFilePath } from './fs';
import { serveFile } from './support/serveFile';
import { pipeStreamAsync } from './support/pipeStreamAsync';
import { Request } from './Request';
import { Headers } from './Headers';

export const createApplication = defineAdapter((applicationOptions) => {
  // This `fromStaticFile` function is identical to that of bun.
  const fromStaticFile = async (
    requestHeaders: Headers,
    file: StaticFile,
  ): Promise<Response | undefined> => {
    const { filePath, options, responseInit: init } = file;
    const resolved = resolveFilePath(filePath, applicationOptions);
    if (!resolved) {
      return;
    }
    const [fullFilePath] = resolved;
    const fileResponse = await serveFile(requestHeaders, fullFilePath, options);
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

  return {
    onError: (request, error) => {
      return new Response(String(error), { status: 500 });
    },
    toResponse: async (request, result) => {
      if (result instanceof StaticFile) {
        result = await fromStaticFile(request.headers, result);
      }
      if (result instanceof Response) {
        return result;
      }
      if (result === undefined) {
        return new Response('Not found', { status: 404 });
      }
      return Response.json(result);
    },
    createNativeHandler: (getResponse) => {
      const handleRequest = async (
        nodeRequest: IncomingMessage,
        nodeResponse: ServerResponse,
      ) => {
        const request = Request.fromNodeRequest(
          nodeRequest,
          applicationOptions,
        );
        const response = await getResponse(request);
        const { status, statusText, headers, bodyRaw: body } = response;
        if (isReadable(body)) {
          await pipeStreamAsync(body, nodeResponse, {
            beforeFirstWrite: () =>
              nodeResponse.writeHead(
                status,
                statusText,
                headers.toNodeHeaders(),
              ),
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
        handleRequest(nodeRequest, nodeResponse).catch((e) => {
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
  };
});
