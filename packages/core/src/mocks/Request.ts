/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Method } from '../types';

import { Headers, type HeadersInit } from './Headers';

type RequestInit = {
  method?: Method;
  headers?: HeadersInit;
  body?: Uint8Array | string;
};

export class Request {
  readonly url: string;
  readonly method: Method;
  readonly headers: Headers;
  // TODO: This should be a readable stream
  readonly body: Uint8Array | string | null;
  readonly bodyUsed = false;

  constructor(url: string, readonly init: RequestInit = {}) {
    const parsed = new URL(url);
    this.url = parsed.pathname;
    this.method = init.method ?? 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body ?? null;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return null as any;
  }

  async text(): Promise<string> {
    return null as any;
  }

  async json<T>(): Promise<T> {
    return null as any;
  }

  // async formData(): Promise<FormData> {
  //   return null as any;
  // }

  // async blob(): Promise<Blob> {
  //   return null as any;
  // }
}
