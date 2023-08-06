import { Body, type BodyInit } from './Body';
import { Headers, type HeadersInit } from './Headers';

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

export class Response extends Body {
  readonly status: number;
  readonly statusText: string;
  readonly headers: HeadersInit;

  constructor(body: BodyInit, init: ResponseInit = {}) {
    super(body);
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? '';
    this.headers = new Headers(init.headers);
  }

  static json(input: unknown, init?: ResponseInit) {
    const body = JSON.stringify(input) ?? '';
    return new Response(body, init);
  }
}
