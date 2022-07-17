import type { Method } from './types';
import { Request as BaseRequest } from './builtins';

// TODO: Use types to ensure .json() can't be called on a GET request
export class Request<
  M extends Method,
  Params extends string,
> extends BaseRequest {
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(...args: ConstructorParameters<typeof BaseRequest>) {
    super(...args);
    const { method, url } = this;
    const { pathname, search, searchParams } = new URL(url);
    this.method = method as M;
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.params = {} as any;
  }

  // json(): M extends MethodWithBody ? Promise<JSONValue> : null {
  //   if (!canHaveBody(this.method)) {
  //     return null as never;
  //   }
  //   throw new Error('request.json() not implemented');
  // }
}
