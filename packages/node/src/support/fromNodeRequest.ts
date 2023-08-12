import type { IncomingMessage } from 'http';

import type { RequestOptions } from '../types';
import { Request } from '../web-io';

import { fromNodeRawHeaders } from './headers';

export function fromNodeRequest(
  nodeRequest: IncomingMessage,
  options: RequestOptions,
) {
  const method = (nodeRequest.method ?? 'GET').toUpperCase();
  const pathname = nodeRequest.url ?? '/';
  const headers = fromNodeRawHeaders(nodeRequest.rawHeaders);
  return new Request(pathname, {
    method,
    headers,
    body: nodeRequest,
    options,
  });
}
