import type { ResponseInit } from '../applicationTypes';

export type StaticFileOptions = {
  /** Max age (in seconds) for the Cache-Control header */
  maxAge?: number | undefined;
  /** Include ETag and Last-Modified headers automatically (default: true) */
  cachingHeaders?: boolean | undefined;
};

export type StaticFileInit = ResponseInit & StaticFileOptions;

export class StaticFile {
  readonly filePath: string;
  readonly responseInit: ResponseInit;
  readonly options: StaticFileOptions;

  constructor(filePath: string, init?: StaticFileInit) {
    this.filePath = filePath;
    const { status, statusText, headers, maxAge, cachingHeaders } = init ?? {};
    this.responseInit = {
      status: status ?? 200,
      statusText: statusText ?? '',
      headers: headers ?? {},
    };
    this.options = { maxAge, cachingHeaders };
  }
}
