import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable, Writable } from 'stream';

import { createCreateApplication } from './core';
import { Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './fs';
import { isReadable, toReadStream } from './support/streams';
import { serveFile } from './support/serveFile';
import { Headers } from './Headers';
import { StaticFile } from './core/StaticFile';
import type { FileServingOptions } from './types';

export const createApplication = createCreateApplication(
  (routeRequest, applicationOptions) => {
    const getResponse = async (nodeRequest: IncomingMessage) => {
      const method = (nodeRequest.method ?? 'GET').toUpperCase();
      const pathname = nodeRequest.url ?? '/';
      const headers = Headers.fromNodeRawHeaders(nodeRequest.rawHeaders);
      const response = await routeRequest({
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
        onError: (error) => new Response(String(error), { status: 500 }),
        toResponse: async (input: unknown) => {
          if (input instanceof Response) {
            return input;
          }
          if (input instanceof StaticFile) {
            return await fromStaticFile(headers, input, applicationOptions);
          }
          return Response.json(input);
        },
      });
      return response ?? new Response('Not found', { status: 404 });
    };

    const handleRequest = async (
      nodeRequest: IncomingMessage,
      nodeResponse: ServerResponse,
    ) => {
      const response = await getResponse(nodeRequest);
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
);

async function fromStaticFile(
  requestHeaders: Headers,
  file: StaticFile,
  fileServingOptions: FileServingOptions,
): Promise<Response | undefined> {
  const { filePath, options, responseInit: init } = file;
  const resolved = resolveFilePath(filePath, fileServingOptions);
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
}

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
