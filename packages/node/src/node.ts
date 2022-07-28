import type { IncomingMessage, ServerResponse } from 'http';

import { createCreateApplication } from './core';
import { Response } from './Response';
import { Request } from './Request';
import { isReadable, toReadStream } from './support/streams';
import { Headers } from './Headers';
import { StaticFile } from './core/StaticFile';
import { pipeStreamAsync } from './support/pipeStreamAsync';
import { fromStaticFile } from './support/fromStaticFile';
import {
  CustomRequest as MockCustomRequest,
  type Request as MockRequest,
} from './mocks/Request';
import type { Method } from './types';

export const createMockApplication = createCreateApplication(
  (routeRequest, _applicationOptions) => {
    return async <M extends Method>(request: MockRequest<M>) => {
      const { method } = request;
      const { pathname } = new URL(request.url);
      const response = await routeRequest({
        method,
        pathname,
        instantiateRequest: (captures) => {
          return new MockCustomRequest(request, captures);
        },
        onError: (error) => {
          return new Response(String(error), { status: 500 });
        },
        toResponse: async (result) => {
          if (result instanceof Response) {
            return result;
          }
          return Response.json(result);
        },
      });
      return response ?? new Response('Not found', { status: 404 });
    };
  },
);

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
        toResponse: async (result) => {
          if (result instanceof Response) {
            return result;
          }
          if (result instanceof StaticFile) {
            return await fromStaticFile(headers, result, applicationOptions);
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
