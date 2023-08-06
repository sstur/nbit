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

  constructor(url: string | URL, readonly init: RequestInit = {}) {
    super(init.body ?? null);
    const parsedUrl = url instanceof URL ? url : new URL(url);
    this.url = parsedUrl.href;
    this.method = init.method ?? 'GET';
    this.headers = new Headers(init.headers);
  }
}
