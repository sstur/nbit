import { Body, type BodyInit } from './Body';
import { Headers, type HeadersInit } from './Headers';

type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
};

export class Request extends Body {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;

  constructor(url: string, readonly init: RequestInit = {}) {
    super(init.body ?? null);
    this.url = url;
    this.method = init.method ?? 'GET';
    this.headers = new Headers(init.headers);
  }
}
