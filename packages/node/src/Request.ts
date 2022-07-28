import { PassThrough as PassThroughStream, type Readable } from 'stream';
import type { IncomingMessage } from 'http';

import { HttpError, parseUrl } from './core';
import { readEntireStream } from './support/readEntireStream';
import type { Headers } from './Headers';
import type { JSONValue, Method, MethodWithBody } from './types';

// 100kb, same as Express, see https://github.com/expressjs/body-parser/blob/9db582d/lib/types/json.js#L54
const BODY_PARSER_DEFAULT_MAX_LENGTH = 100 * 1024;

// Same as Express
const TOO_LARGE = { status: 413, message: 'Request Entity Too Large' };
const SIZE_MISMATCH = {
  status: 400,
  message: 'Request size did not match content length',
};

export type RequestOptions = {
  bodyParserMaxLength?: number;
};

// A cache associated with the underlying request used for memoization of
// expensive or non-idempotent tasks such as request body parsing.
type Cache = {
  bodyPromise?: Promise<Buffer>;
};

const requestCache = new WeakMap<IncomingMessage, Cache>();

function getOrInitMemoizationCache(request: IncomingMessage): Cache {
  const cache = requestCache.get(request) ?? {};
  requestCache.set(request, cache);
  return cache;
}

export class Request<M extends Method, Params extends string> {
  private request: IncomingMessage;
  private cache: Cache;
  private maxLength: number;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly headers: Headers;
  readonly params: { [K in Params]: string };

  constructor(
    request: IncomingMessage,
    headers: Headers,
    params: Record<string, string>,
    options: RequestOptions,
  ) {
    this.request = request;
    this.cache = getOrInitMemoizationCache(request);
    const { method = 'GET', url } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = parseUrl(url ?? '');
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.headers = headers;
    this.params = params as { [K in Params]: string };
    this.maxLength =
      options.bodyParserMaxLength || BODY_PARSER_DEFAULT_MAX_LENGTH;
  }

  // TODO: This should throw if the stream has already been read, either from
  // this function or by .getBody()
  getReadStream(
    ..._: M extends MethodWithBody ? [] : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  ): Readable {
    // TODO: I'm not sure if this PassThroughSteam is necessary.
    const passThroughStream = new PassThroughStream();
    this.request.pipe(passThroughStream);
    return passThroughStream as never;
  }

  async text(
    ..._: M extends MethodWithBody ? [] : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  ): Promise<string> {
    const buffer = await this.getBody();
    return buffer.toString('utf8');
  }

  async json(
    ..._: M extends MethodWithBody ? [] : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  ): Promise<JSONValue> {
    const buffer = await this.getBody();
    try {
      const parsed = JSON.parse(buffer.toString('utf8'));
      // @ts-expect-error - Compatibility with Express's hackiness
      this.request._body = parsed;
      return parsed;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new HttpError({
        status: 400,
        message: `Invalid request body: ${message}`,
      });
    }
  }

  private async getBody() {
    const { maxLength, headers } = this;
    const contentLength = headers.get('content-length');
    const expectedLength = contentLength ? Number(contentLength) | 0 : null;
    if (expectedLength != null && expectedLength > maxLength) {
      throw new HttpError(TOO_LARGE);
    }
    let body;
    try {
      body = await this.memo('bodyPromise', () =>
        readEntireStream(this.request, { maxLength }),
      );
    } catch (e) {
      if (e instanceof Error && e.name === 'MaxLengthExceededError') {
        throw new HttpError(TOO_LARGE);
      }
      throw e;
    }
    if (expectedLength != null && expectedLength !== body.length) {
      throw new HttpError(SIZE_MISMATCH);
    }
    return body;
  }

  private memo<K extends keyof Cache>(
    key: K,
    getter: () => Exclude<Cache[K], undefined>,
  ) {
    const { cache } = this;
    return cache[key] ?? (cache[key] = getter());
  }
}
