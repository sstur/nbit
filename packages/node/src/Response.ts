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

  get ok() {
    return this.status >= 200 && this.status <= 299;
  }

  static redirect(url: string, status?: RedirectStatus) {
    return new Response('', {
      status: status ?? 302,
      // Note: express would percent-encode this URL using npm.im/encodeurl
      // In the spec, there is a well-defined set of valid characters, see https://github.com/nodejs/undici/blob/0ef0e265e1c8edf2614f058ea1a4224349680e99/lib/fetch/util.js#L116
      // Invalid characters include, anything above 0x7e, anything below 0x21 or
      // any of the following 17 characters: ()<>@,;:\"/[]?={}
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
