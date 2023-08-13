/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, type Headers } from '../web-io';
import type { JSONValue, MethodNoBody } from '../types';

import { HttpError } from './HttpError';
import { parseUrl } from './support/parseUrl';

// TODO: Remove the conditional type when Bun types are updated
type BodyStream = Request extends { body: infer T } ? Exclude<T, null> : never;
type BodyAccessorArgs<M> = M extends MethodNoBody
  ? [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  : [];

const canHaveNullBody = new Set(['GET', 'DELETE', 'HEAD', 'OPTIONS']);

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
  private _fallbackBody: BodyStream | undefined;

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

  get body(): M extends MethodNoBody ? null : BodyStream {
    // TODO: Remove the Object() hack when Bun types are updated
    const body = Object(this.request).body as BodyStream | null;
    // Ensure that for requests that can have a body we never return null
    if (!canHaveNullBody.has(this.method) && body == null) {
      const emptyBody =
        this._fallbackBody ?? (this._fallbackBody = createEmptyBody());
      return emptyBody as any;
    }
    return body as any;
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
        const parsed = await this.request.json();
        return parsed as any;
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

// This is a bit of a roundabout way to do this but it should work with any of
// the supported platform's Request implementation.
function createEmptyBody(): BodyStream {
  const request = new Request('http://localhost/', {
    method: 'POST',
    body: '',
  });
  return request.body as any;
}
