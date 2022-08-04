import type { IncomingMessage, ServerResponse } from 'http';

import { defineAdapter } from './core';
import { Response } from './Response';
import { isReadable } from './support/streams';
import { StaticFile } from './core/StaticFile';
import { pipeStreamAsync } from './support/pipeStreamAsync';
import { fromStaticFile } from './support/fromStaticFile';
import { Request } from './Request';

export const createApplication = defineAdapter((applicationOptions) => ({
  onError: (request, error) => {
    return new Response(String(error), { status: 500 });
  },
  toResponse: async (request, result) => {
    if (result instanceof StaticFile) {
      result = await fromStaticFile(
        request.headers,
        result,
        applicationOptions,
      );
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
      const request = Request.fromNodeRequest(nodeRequest, applicationOptions);
      const response = await getResponse(request);
      const { status, statusText, headers, bodyRaw: body } = response;
      if (isReadable(body)) {
        await pipeStreamAsync(body, nodeResponse, {
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
}));
