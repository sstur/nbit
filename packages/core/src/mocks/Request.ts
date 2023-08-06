/* eslint-disable @typescript-eslint/no-explicit-any */
import { Headers, type HeadersInit } from './Headers';

class ReadableStream {}

type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: Uint8Array | string;
};

export class Request {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly body: ReadableStream | null;
  readonly bodyUsed = false;

  constructor(url: string, readonly init: RequestInit = {}) {
    const parsed = new URL(url);
    this.url = parsed.pathname;
    this.method = init.method ?? 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body ?? null;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return Buffer.from('');
  }

  async text(): Promise<string> {
    return '';
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
