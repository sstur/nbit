import type { HeadersInit } from './Headers';

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

type ResponseBody = Uint8Array | string;

export class Response {
  readonly status: number;
  readonly headers: HeadersInit;

  constructor(readonly body: ResponseBody, readonly init: ResponseInit = {}) {
    this.status = init.status ?? 200;
    this.headers = init.headers ?? [];
  }

  static json(input: unknown, init?: ResponseInit) {
    const body = JSON.stringify(input) ?? '';
    return new Response(body, init);
  }
}
