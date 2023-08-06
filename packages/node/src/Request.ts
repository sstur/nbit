import type { IncomingMessage } from 'http';

import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';
import type { MethodAny, RequestOptions } from './types';
import { HttpError } from './core/HttpError';

// Same as Express
const TOO_LARGE = { status: 413, message: 'Request Entity Too Large' };
const SIZE_MISMATCH = {
  status: 400,
  message: 'Request body size did not match content-length header',
};

type RequestInit = {
  method?: MethodAny;
  headers?: HeadersInit;
  body?: BodyInit;
  options?: RequestOptions;
};

export class Request extends Body {
  readonly method: MethodAny;
  readonly url: string;
  readonly headers: Headers;

  constructor(url: string, init?: RequestInit) {
    const { bodyParserMaxBufferSize: maxBufferSize } = init?.options ?? {};
    const headers = new Headers(init?.headers);
    const expectedSize = getContentLength(headers);
    super(init?.body, {
      maxBufferSize,
      expectedSize,
      onReadError: (error) => {
        if (error.name === 'MaxSizeExceededError') {
          return new HttpError(TOO_LARGE);
        }
        if (error.name === 'ExpectedSizeMismatchError') {
          return new HttpError(SIZE_MISMATCH);
        }
        return error;
      },
    });
    this.url = url;
    this.method = init?.method ? init.method.toUpperCase() : 'GET';
    this.headers = headers;
  }

  static fromNodeRequest(
    nodeRequest: IncomingMessage,
    options: RequestOptions,
  ) {
    const method = (nodeRequest.method ?? 'GET').toUpperCase();
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
