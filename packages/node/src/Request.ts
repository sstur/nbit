import type { IncomingMessage } from 'http';

import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';
import type { JSONValue, Method, RequestOptions } from './types';
import { HttpError } from './core';

// Same as Express
const TOO_LARGE = { status: 413, message: 'Request Entity Too Large' };
const SIZE_MISMATCH = {
  status: 400,
  message: 'Request body size did not match content-length header',
};

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
    this.method = (init?.method ? init.method.toUpperCase() : 'GET') as Method;
    this.headers = headers;
  }

  async json<T = JSONValue>(): Promise<T> {
    const contentType = getContentType(this.headers);
    let message = 'Invalid JSON body';
    if (contentType === 'application/json') {
      try {
        return await super.json<T>();
      } catch (e) {
        message = e instanceof Error ? e.message : String(e);
      }
    }
    throw new HttpError({ status: 400, message });
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

function getContentType(headers: Headers) {
  const contentType = headers.get('content-type');
  if (contentType != null) {
    return (contentType.split(';')[0] ?? '').toLowerCase();
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
