import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable, Writable } from 'stream';

import { createCreateApplication, HttpError } from './core';
import { isStaticFile, Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './support/resolveFilePath';
import { isReadable, toReadStream } from './support/streams';
import { serveFile } from './support/serveFile';
import { Headers } from './Headers';

export const createApplication = createCreateApplication((router, options) => {
  const { getContext } = options;

  // TODO: Rename this to processRequest or getResponse?
  const routeRequest = async (
    nodeRequest: IncomingMessage,
    headers: Headers,
  ): Promise<Response> => {
    const method = (nodeRequest.method ?? 'GET').toUpperCase();
    const pathname = nodeRequest.url ?? '/';
    // TODO: Factor this getResult up into core? Would need the old approach of Captures -> Request
    const getResult = async () => {
      const matches = router.getMatches(method, pathname);
      for (const [handler, captures] of matches) {
        const request = new Request(nodeRequest, headers, captures, options);
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
        return new Response('Not found', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
        });
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
    const { status, headers, body } = response;
    if (isStaticFile(body)) {
      const { filePath } = body;
      const resolved = resolveFilePath(filePath, options);
      if (!resolved) {
        // TODO: Better error
        nodeResponse.writeHead(403);
        nodeResponse.end('Unable to serve file');
        return;
      }
      const [fullFilePath] = resolved;
      const fileResponse = await serveFile(requestHeaders, fullFilePath);
      if (!fileResponse) {
        nodeResponse.writeHead(404);
        nodeResponse.end();
        return;
      }
      // The status might be something like 304 Not Modified
      const newStatus = fileResponse.status ?? status;
      const newHeaders = { ...fileResponse.headers, ...headers };
      await pipeStreamAsync(fileResponse.readStream, nodeResponse, {
        beforeFirstWrite: () => nodeResponse.writeHead(newStatus, newHeaders),
      });
      return;
    } else if (isReadable(body)) {
      const readStream = toReadStream(body);
      await pipeStreamAsync(readStream, nodeResponse, {
        beforeFirstWrite: () => nodeResponse.writeHead(status, headers),
      });
    } else {
      nodeResponse.writeHead(status, headers);
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
});

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
