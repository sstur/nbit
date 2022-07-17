import { createReadStream } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';

import { createCreateApplication, HttpError } from './core';
import { isStaticFile, Response } from './Response';
import { Request } from './Request';
import { resolveFilePath } from './support/resolveFilePath';

export const createApplication = createCreateApplication((router, options) => {
  const { getContext } = options;

  const routeRequest = async (
    nodeRequest: IncomingMessage,
  ): Promise<Response> => {
    const method = (nodeRequest.method ?? 'GET').toUpperCase();
    const path = nodeRequest.url ?? '/';
    try {
      const result = await router.route(method, path, (captures) => {
        const request = new Request(nodeRequest, Object.fromEntries(captures));
        const context = getContext?.(request);
        const requestWithContext =
          context === undefined ? request : Object.assign(request, context);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return requestWithContext as any;
      });
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

  return async (nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
    const response = await routeRequest(nodeRequest);
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
      // TODO: Deal with caching headers
      // TODO: Ensure file exists
      // TODO: Content-Type, .on('error')
      nodeResponse.writeHead(status, headers);
      createReadStream(fullFilePath).pipe(nodeResponse);
      return;
    }
    // else if (body instanceof ReadableStream) {
    //   nodeResponse.writeHead(status, headers);
    //   body.pipe(nodeResponse);
    // }
    else {
      nodeResponse.writeHead(status, headers);
      if (body != null) {
        nodeResponse.write(body);
      }
      nodeResponse.end();
    }
  };
});
