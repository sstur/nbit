import { PassThrough as PassThroughStream } from 'stream';
import type { IncomingMessage } from 'http';

import { canHaveBody, parseUrl } from './core';
import { Headers } from './Headers';
import type { JSONValue, Method, MethodWithBody } from './types';

type ReadableStream = NodeJS.ReadableStream;

export class Request<M extends Method, Params extends string> {
  private request: IncomingMessage;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly headers: Headers;
  readonly params: { [K in Params]: string };

  constructor(request: IncomingMessage, params: Record<string, string>) {
    this.request = request;
    const { method = 'GET', url, rawHeaders } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = parseUrl(url ?? '');
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    const headers = new Headers();
    for (let i = 0; i < rawHeaders.length; i++) {
      const name = rawHeaders[i] ?? '';
      const value = rawHeaders[++i] ?? '';
      headers.append(name, value);
    }
    this.headers = headers;
    this.params = params as { [K in Params]: string };
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

  json(): M extends MethodWithBody ? Promise<JSONValue> : null {
    if (!canHaveBody(this.method)) {
      return null as never;
    }
    throw new Error('request.json() not implemented');
  }
}
