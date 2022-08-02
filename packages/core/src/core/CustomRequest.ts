/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Headers } from '../applicationTypes';
import type { JSONValue, Method, MethodWithBody } from '../types';

import { parseUrl } from './support/parseUrl';

// TODO: Remove the conditional type when Bun types are updated
type BodyStream = Request extends { body: any } ? Request['body'] : never;
type BodyAccessorArgs<M> = M extends MethodWithBody
  ? []
  : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD'];

export class CustomRequest<M extends Method, Params extends string> {
  private request: Request;
  readonly method: M;
  readonly url: string;
  readonly headers: Headers;
  // These are the custom ones
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(request: Request) {
    this.request = request;
    const { method, url, headers } = request;
    this.method = method as M;
    this.url = url;
    this.headers = headers;
    // Attach some custom fields
    const { pathname, search, searchParams } = parseUrl(url);
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.params = {} as { [K in Params]: string };
  }

  get body(): M extends MethodWithBody ? BodyStream : never {
    // TODO: Remove the Object() hack when Bun types are updated
    return Object(this.request).body as any;
  }

  get bodyUsed() {
    // TODO: Remove the Object() hack when Bun types are updated
    return Boolean(Object(this.request).bodyUsed);
  }

  arrayBuffer(..._: BodyAccessorArgs<M>) {
    return this.request.arrayBuffer();
  }

  text(..._: BodyAccessorArgs<M>) {
    return this.request.text();
  }

  json<T = JSONValue>(..._: BodyAccessorArgs<M>): Promise<T> {
    return this.request.json<T>();
  }

  // blob() {
  //   return this.request.blob();
  // }
}
