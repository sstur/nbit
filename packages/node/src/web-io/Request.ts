import { HttpError } from '../core/HttpError';
import type { RequestOptions } from '../types';

import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';

// Same as Express
const TOO_LARGE = { status: 413, message: 'Request Entity Too Large' };
const SIZE_MISMATCH = {
  status: 400,
  message: 'Request body size did not match content-length header',
};

export type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  options?: RequestOptions;
};

export class Request extends Body {
  readonly method: string;
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
    this.method = init?.method?.toUpperCase() ?? 'GET';
    this.headers = headers;
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
