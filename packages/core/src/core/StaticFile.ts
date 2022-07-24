import type { ResponseInit } from '../applicationTypes';

export type StaticFileOptions = {
  maxAge?: number;
  cachingHeaders?: boolean;
};

export class StaticFile {
  readonly filePath: string;
  readonly responseInit: ResponseInit;
  readonly options: StaticFileOptions;

  constructor(filePath: string, init?: ResponseInit & StaticFileOptions) {
    this.filePath = filePath;
    const { status, statusText, headers, ...options } = init ?? {};
    this.responseInit = {
      status: status ?? 200,
      statusText: statusText ?? '',
      headers: headers ?? {},
    };
    this.options = options;
  }
}
