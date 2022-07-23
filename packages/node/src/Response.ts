import type { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

type Headers = Record<string, string | Array<string>>;

type Body =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | StaticFile
  | string;

type RedirectStatus = 301 | 302 | 303 | 304 | 307 | 308;

type ResponseInit = {
  status?: number;
  headers?: Headers;
};

export class StaticFile {
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }
}

export class Response {
  readonly status: number;
  readonly headers: Headers;
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

  static file(filePath: string, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    return new Response(new StaticFile(filePath), {
      status: status ?? 200,
      headers: headers ?? {},
    });
  }
}

export function isStaticFile(object: unknown): object is StaticFile {
  return object instanceof StaticFile;
}
