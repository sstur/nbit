import type { IncomingMessage, ServerResponse } from 'http';

import { createCreateApplication } from './core';
import { Response } from './Response';
import { CustomRequest } from './Request';
import { isReadable, toReadStream } from './support/streams';
import { StaticFile } from './core/StaticFile';
import { pipeStreamAsync } from './support/pipeStreamAsync';
import { fromStaticFile } from './support/fromStaticFile';
import { Request } from './webio/Request';
import type { Method } from './types';

export const createApplication = createCreateApplication(
  (routeRequest, applicationOptions) => {
    const getResponse = async (nodeRequest: IncomingMessage) => {
      const method = (nodeRequest.method ?? 'GET').toUpperCase() as Method;
      const pathname = nodeRequest.url ?? '/';
      const request = Request.fromNodeRequest(nodeRequest);
      const response = await routeRequest({
        method,
        pathname,
        instantiateRequest: (captures) => {
          // TODO: Move this part out to core
          return new CustomRequest(request, captures);
        },
        onError: (error) => new Response(String(error), { status: 500 }),
        toResponse: async (result) => {
          if (result instanceof Response) {
            return result;
          }
          if (result instanceof StaticFile) {
            return await fromStaticFile(
              request.headers,
              result,
              applicationOptions,
            );
          }
          return Response.json(result);
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
