/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Headers } from '../applicationTypes';
import type { JSONValue, MethodNoBody } from '../types';

import { HttpError } from './HttpError';
import { parseUrl } from './support/parseUrl';

// TODO: Remove the conditional type when Bun types are updated
type BodyStream = Request extends { body: infer T } ? T : never;
type BodyAccessorArgs<M> = M extends MethodNoBody
  ? [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  : [];

export class CustomRequest<M extends string, Params extends string> {
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

  get body(): M extends MethodNoBody ? never : BodyStream {
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

  async json<T = JSONValue>(..._: BodyAccessorArgs<M>): Promise<T> {
    const contentType = getContentType(this.headers);
    let message = 'Invalid JSON body';
    if (contentType === 'application/json') {
      try {
        return await this.request.json<T>();
      } catch (e) {
        message = e instanceof Error ? e.message : String(e);
      }
    }
    throw new HttpError({ status: 400, message });
  }

  // Note: Not implemented yet; we can implement this if we bump the minimum supported Node version to v14.18
  // blob() {
  //   return this.request.blob();
  // }
}

function getContentType(headers: Headers) {
  const contentType = headers.get('content-type');
  if (contentType != null) {
    return (contentType.split(';')[0] ?? '').toLowerCase();
  }
}
