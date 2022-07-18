import type { JSONValue, Method, MethodWithBody } from './types';
import type { Request as BaseRequest } from './builtins';

// TODO: request.body getter to return ReadableStream
export class Request<M extends Method, Params extends string> {
  private request: BaseRequest;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly headers: Headers;
  readonly params: { [K in Params]: string };

  constructor(request: BaseRequest, params: Record<string, string>) {
    this.request = request;
    const { method, url, headers } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = new URL(url);
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.headers = headers;
    this.params = params as { [K in Params]: string };
  }

  // TODO: What happens if we call one of these body methods and then later call
  // the same one or a different one?
  text(): M extends MethodWithBody ? Promise<string> : null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request.text() as any;
  }

  arrayBuffer(): M extends MethodWithBody ? Promise<ArrayBuffer> : null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request.arrayBuffer() as any;
  }

  json(): M extends MethodWithBody ? Promise<JSONValue> : null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request.json() as any;
  }

  blob(): M extends MethodWithBody ? Promise<Blob> : null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request.blob() as any;
  }
}
