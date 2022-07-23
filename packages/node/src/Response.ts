import type { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

import { StaticFile, type StaticFileOptions } from './core/StaticFile';

type HeadersInit =
  | Record<string, string | Array<string>>
  | Array<[string, string]>;

type Body =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | StaticFile
  | string;

type RedirectStatus = 301 | 302 | 303 | 304 | 307 | 308;

type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
};

export class Response {
  readonly status: number;
  readonly headers: HeadersInit;
  readonly body: Body;

  constructor(body: Body, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    this.status = status ?? 200;
    this.headers = headers ?? {};
    this.body = body;
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
    const { status, headers } = init ?? {};
    const body = JSON.stringify(payload) ?? 'null';
    return new Response(body, {
      status: status ?? 200,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        ...headers,
      },
    });
  }

  static file(filePath: string, init?: ResponseInit & StaticFileOptions) {
    const { status, statusText, headers, ...options } = init ?? {};
    return new Response(new StaticFile(filePath, options), {
      status: status ?? 200,
      statusText: statusText ?? '',
      headers: headers ?? [],
    });
  }
}

export function isStaticFile(object: unknown): object is StaticFile {
  return object instanceof StaticFile;
}
