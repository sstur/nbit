// TODO: Can we make this opaque?
type Stream = NodeJS.ReadableStream;

type Body = Stream | StaticFile | Buffer | string | null;

type RedirectStatus = 301 | 302 | 303 | 304 | 307 | 308;

type ResponseInit = {
  status?: number;
  headers?: Record<string, string | Array<string>>;
};

export class StaticFile {
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }
}

export class Response {
  readonly status: number;
  readonly headers: Record<string, string | Array<string>>;
  readonly body: Body;

  constructor(body: Body, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    this.status = status ?? 200;
    this.headers = headers ?? {};
    this.body = body;
  }

  static redirect(url: string, init?: { status?: RedirectStatus }) {
    const { status } = init ?? {};
    return new Response(null, {
      status: status ?? 302,
      // Note: express would percent-encode this URL using npm.im/encodeurl
      headers: { Location: url },
    });
  }

  static json(payload: unknown, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    // Note: This next line will throw if payload has circular references
    const body = JSON.stringify(payload) ?? null;
    return new Response(body, {
      status: status ?? 200,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        ...headers,
      },
    });
  }

  static fromStream(readStream: Stream, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    return new Response(readStream, {
      status: status ?? 200,
      headers: headers ?? {},
    });
  }

  static sendFile(filePath: string, init?: ResponseInit) {
    const { status, headers } = init ?? {};
    return new Response(new StaticFile(filePath), {
      status: status ?? 200,
      headers: headers ?? {},
    });
  }
}

export function isStream(object: unknown): object is NodeJS.ReadableStream {
  return typeof Object(object).on === 'function';
}

export function isStaticFile(object: unknown): object is StaticFile {
  return object instanceof StaticFile;
}
