import { Headers, type HeadersInit } from '../Headers';
import type { Method } from '../types';

import { Body, type BodyInit } from './Body';

type RequestInit = {
  method?: Method | Lowercase<Method>;
  headers?: HeadersInit;
  body?: BodyInit;
};

// TODO:
//  - Deal with RequestOptions.bodyParserMaxLength
//  - Grab content-length and somehow pass it to body so it can error if mismatch (and error early if larger than allowed)
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
}
