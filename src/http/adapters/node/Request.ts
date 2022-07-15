import { PassThrough as PassThroughStream } from 'stream';
import type { IncomingMessage } from 'http';

import { canHaveBody } from '../../support/canHaveBody';
import { parseUrl } from '../../support/parseUrl';
import type { Method, MethodWithBody } from '../../types';

import { Headers } from './Headers';

type ReadableStream = NodeJS.ReadableStream;

export class Request<M extends Method, Params extends string> {
  private request: IncomingMessage;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly params: { [K in Params]: string };

  constructor(request: IncomingMessage, params: Record<string, string>) {
    this.request = request;
    const { method = 'GET', rawHeaders } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = parseUrl(request.url ?? '');
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    const headers = new Headers();
    for (let i = 0; i < rawHeaders.length; i++) {
      const name = rawHeaders[i] ?? '';
      const value = rawHeaders[++i] ?? '';
      headers.append(name, value);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.params = params as any;
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
