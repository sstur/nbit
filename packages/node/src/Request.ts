import type { IncomingMessage } from 'http';

import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';
import type { Method, RequestOptions } from './types';

type RequestInit = {
  method?: Method | Lowercase<Method>;
  headers?: HeadersInit;
  body?: BodyInit;
  options?: RequestOptions;
};

export class Request extends Body {
  readonly method: Method;
  readonly url: string;
  readonly headers: Headers;

  constructor(url: string, init?: RequestInit) {
    const { bodyParserMaxBufferSize: maxBufferSize } = init?.options ?? {};
    const headers = new Headers(init?.headers);
    const expectedSize = getContentLength(headers);
    super(init?.body ?? null, { maxBufferSize, expectedSize });
    this.url = url;
    this.method = (init?.method ? init.method.toUpperCase() : 'GET') as Method;
    this.headers = headers;
  }

  static fromNodeRequest(
    nodeRequest: IncomingMessage,
    options: RequestOptions,
  ) {
    const method = (nodeRequest.method ?? 'GET').toUpperCase() as Method;
    const pathname = nodeRequest.url ?? '/';
    const headers = Headers.fromNodeRawHeaders(nodeRequest.rawHeaders);
    return new Request(pathname, {
      method,
      headers,
      body: nodeRequest,
      options,
    });
  }
}

function getContentLength(headers: Headers) {
  const contentLength = headers.get('content-length');
  if (contentLength != null) {
    const parsed = parseInt(contentLength, 10);
    if (isFinite(parsed)) {
      return parsed;
    }
  }
}
