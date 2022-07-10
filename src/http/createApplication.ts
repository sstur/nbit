import { type IncomingMessage, type ServerResponse } from 'http';
import path from 'path';

import { Router } from './Router';
import { Request } from './Request';
import { isStream, isStaticFile, Response } from './Response';
import { HttpError } from './HttpError';
import { type Method, type Route } from './types';

type Options = {
  /** The root from which file names will be resolved when serving files */
  root: string;
  /**
   * An array of paths (relative to root) from which static files are _allowed_
   * to be served. For now this only supports a single path.
   */
  allowStaticFrom: [string];
};

export function createApplication(options: Options) {
  const projectRoot = path.resolve(options.root);
  const _allowedRoot = path.join(projectRoot, options.allowStaticFrom[0]);

  const attachRoutes = (...routeLists: Array<Array<Route>>) => {
    const router = new Router<Request<Method, string>>();
    for (const routeList of routeLists) {
      for (const [method, path, handler] of routeList) {
        router.attachRoute(method, path, handler);
      }
    }
    return getRequestHandler(router);
  };

  return { attachRoutes };
}

function getRequestHandler(router: Router<Request<Method, string>>) {
  return async (nodeRequest: IncomingMessage, nodeResponse: ServerResponse) => {
    const response = await routeRequest(router, nodeRequest);
    const { status, headers, body } = response;
    if (isStaticFile(body)) {
      // TODO: Send file
      nodeResponse.writeHead(500);
      nodeResponse.end('Error: File serving not yet implemented');
    } else if (isStream(body)) {
      nodeResponse.writeHead(status, headers);
      body.pipe(nodeResponse);
    } else {
      nodeResponse.writeHead(status, headers);
      if (body != null) {
        nodeResponse.write(body);
      }
      nodeResponse.end();
    }
  };
}

async function routeRequest(
  router: Router<Request<Method, string>>,
  nodeRequest: IncomingMessage,
): Promise<Response> {
  const method = (nodeRequest.method ?? 'GET').toUpperCase();
  const path = nodeRequest.url ?? '/';
  try {
    const result = await router.route(
      method,
      path,
      (captures) => new Request(nodeRequest, Object.fromEntries(captures)),
    );
    if (result) {
      // TODO: If result is an object containing a circular reference, this
      // next line will throw, resulting in a 500 response with no
      // indication of which handler caused it.
      return result instanceof Response ? result : Response.json(result);
    } else {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    }
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
}
