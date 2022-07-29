/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Headers } from '../applicationTypes';
import type { JSONValue, Method, MethodWithBody } from '../types';

type BodyStream = Request['body'];
type BodyAccessorArgs<M> = M extends MethodWithBody
  ? []
  : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD'];

// TODO: request.body getter to return ReadableStream
export default class CustomRequest<M extends Method, Params extends string> {
  private request: Request;
  readonly method: M;
  readonly url: string;
  readonly headers: Headers;
  // These are the custom ones
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(request: Request, params: Record<string, string>) {
    this.request = request;
    const { method, url, headers } = request;
    this.method = method as M;
    this.url = url;
    this.headers = headers;
    // Attach some custom fields
    const { pathname, search, searchParams } = new URL(url);
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.params = params as { [K in Params]: string };
  }

  get body(): M extends MethodWithBody ? BodyStream : never {
    return this.request.body as any;
  }

  get bodyUsed() {
    return this.request.bodyUsed;
  }

  arrayBuffer(..._: BodyAccessorArgs<M>) {
    return this.request.arrayBuffer();
  }

  text(..._: BodyAccessorArgs<M>) {
    return this.request.text();
  }

  json<T = JSONValue>(..._: BodyAccessorArgs<M>): Promise<T> {
    return this.request.json();
  }

  // blob() {
  //   return this.request.blob();
  // }
}
