import type { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import { TextDecoder } from 'util';

import { StaticFile, type StaticFileOptions } from './core/StaticFile';
import { Headers, type HeadersInit } from './Headers';

type ResponseBody =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | string;

type RedirectStatus = 301 | 302 | 303 | 304 | 307 | 308;

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

export class Response {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly body: ResponseBody;

  constructor(body: ResponseBody, init?: ResponseInit) {
    const { status, statusText, headers } = init ?? {};
    this.status = status ?? 200;
    this.statusText = statusText ?? '';
    this.headers = new Headers(headers);
    this.body = body;
  }

  async json() {
    const { body } = this;
    if (body instanceof Uint8Array || typeof body === 'string') {
      return JSON.parse(toString(body));
    } else {
      return null;
    }
  }

  static redirect(url: string, init?: { status?: RedirectStatus }) {
    const { status } = init ?? {};
    return new Response('', {
      status: status ?? 302,
      // Note: express would percent-encode this URL using npm.im/encodeurl
      headers: { Location: url },
    });
  }

  // Note: This will throw if payload has circular references
  static json(payload: unknown, init?: ResponseInit) {
    const body = JSON.stringify(payload) ?? 'null';
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json; charset=UTF-8');
    return new Response(body, {
      ...init,
      headers,
    });
  }

  static file(filePath: string, init?: ResponseInit & StaticFileOptions) {
    return new StaticFile(filePath, init);
  }
}

function toString(body: string | Uint8Array): string {
  return body instanceof Uint8Array ? new TextDecoder().decode(body) : body;
}
