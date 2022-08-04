import { StaticFile, type StaticFileOptions } from './core/StaticFile';
import { Headers, type HeadersInit } from './Headers';
import { Body, type BodyInit } from './Body';

type RedirectStatus = 301 | 302 | 303 | 307 | 308;

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

export class Response extends Body {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;

  constructor(body: BodyInit, init?: ResponseInit) {
    super(body);
    const { status, statusText, headers } = init ?? {};
    this.status = status ?? 200;
    this.statusText = statusText ?? '';
    this.headers = new Headers(headers);
  }

  static redirect(url: string, status?: RedirectStatus) {
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
