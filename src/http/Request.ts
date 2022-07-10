import type { Method, MethodWithBody } from './types';
import type { Request as BaseRequest } from './builtins/Request';

// This is required by `new URL()` for parsing but it doesn't matter what value
// this has since it's not used.
// See: https://nodejs.org/docs/latest-v12.x/api/url.html#url_url
const URL_BASE = 'https://0.0.0.0';

export class Request<M extends Method, Params extends string> {
  readonly method: M;
  readonly headers: Headers;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(request: BaseRequest, params: Record<string, string>) {
    const { method, headers, url } = request;
    const { pathname, search, searchParams } = new URL(url ?? '', URL_BASE);
    this.headers = headers;
    this.method = method as M;
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.params = params as any;
  }

  json(): M extends MethodWithBody ? Promise<JSONValue> : null {
    if (!canHaveBody(this.method)) {
      return null as never;
    }
    throw new Error('request.json() not implemented');
  }
}

export function canHaveBody(method: Method): method is MethodWithBody {
  return method === 'POST' || method === 'PUT';
}
