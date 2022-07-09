import { URL, type URLSearchParams } from 'url';
import { PassThrough as PassThroughStream } from 'stream';
import type { IncomingHttpHeaders } from 'http';

import {
  json,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';

import type { Method, MethodWithBody } from './types';

type ReadableStream = NodeJS.ReadableStream;

// This is required by `new URL()` for parsing but it doesn't matter what value
// this has since it's not used.
// See: https://nodejs.org/docs/latest-v12.x/api/url.html#url_url
const URL_BASE = 'https://0.0.0.0';

const jsonParserMiddleware = json();

function parseJsonBody(request: ExpressRequest, response: ExpressResponse) {
  return new Promise<JSONValue>((resolve, reject) => {
    jsonParserMiddleware(request, response, (error) => {
      error ? reject(error) : resolve(request.body);
    });
  });
}

function canHaveBody(method: Method): method is MethodWithBody {
  return method === 'POST' || method === 'PUT';
}

class Headers {
  private headers: IncomingHttpHeaders;

  constructor(headers: IncomingHttpHeaders) {
    this.headers = headers;
  }

  get(name: string) {
    const value = this.headers[name.toLowerCase()];
    return Array.isArray(value) ? value.join(', ') : value;
  }
}

export class Request<M extends Method, Params extends string> {
  private request: ExpressRequest;
  private response: ExpressResponse;
  private parsedBodyPromise: Promise<JSONValue> | undefined;

  readonly method: M;
  readonly headers: Headers;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(request: ExpressRequest, response: ExpressResponse) {
    this.request = request;
    this.response = response;
    const { method, headers, url, params } = request;
    const { pathname, search, searchParams } = new URL(url, URL_BASE);
    this.headers = new Headers(headers);
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
    const promise: Promise<JSONValue> =
      this.parsedBodyPromise ||
      (this.parsedBodyPromise = parseJsonBody(this.request, this.response));
    return promise as never;
  }

  getReadStream(): M extends MethodWithBody ? ReadableStream : null {
    if (!canHaveBody(this.method)) {
      return null as never;
    }
    // TODO: I'm not sure if this PassThroughSteam is necessary.
    const passThroughStream = new PassThroughStream();
    this.request.pipe(passThroughStream);
    return passThroughStream as never;
  }
}
