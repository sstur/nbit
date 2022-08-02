import type { IncomingMessage } from 'http';

import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';
import type { Method } from './types';

type RequestInit = {
  method?: Method | Lowercase<Method>;
  headers?: HeadersInit;
  body?: BodyInit;
};

// TODO: Deal with RequestOptions.bodyParserMaxLength
// TODO: Grab content-length and somehow pass it to body so it can error if mismatch (and error early if larger than allowed)
export class Request extends Body {
  readonly method: Method;
  readonly url: string;
  readonly headers: Headers;

  constructor(url: string, init?: RequestInit) {
    super(init?.body ?? null);
    this.url = url;
    this.method = (init?.method ? init.method.toUpperCase() : 'GET') as Method;
    this.headers = new Headers(init?.headers);
  }

  static fromNodeRequest(nodeRequest: IncomingMessage) {
    const method = (nodeRequest.method ?? 'GET').toUpperCase() as Method;
    const pathname = nodeRequest.url ?? '/';
    const headers = Headers.fromNodeRawHeaders(nodeRequest.rawHeaders);
    // TODO: Somehow pass in applicationOptions for bodyParserMaxLength
    return new Request(pathname, {
      method,
      headers,
      body: nodeRequest,
    });
  }
}
