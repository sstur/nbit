import type { Readable } from 'stream';

import { HttpError, parseUrl } from './core';
import type { Headers } from './Headers';
import type { JSONValue, Method, MethodWithBody } from './types';
import type { Request } from './webio/Request';

// Same as Express
const TOO_LARGE = { status: 413, message: 'Request Entity Too Large' };
const SIZE_MISMATCH = {
  status: 400,
  message: 'Request size did not match content length',
};

export class CustomRequest<M extends Method, Params extends string> {
  private request: Request;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly headers: Headers;
  readonly params: { [K in Params]: string };

  constructor(request: Request, params: Record<string, string>) {
    this.request = request;
    const { method = 'GET', url } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = parseUrl(url ?? '');
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.headers = request.headers;
    this.params = params as { [K in Params]: string };
  }

  // TODO: This should throw if the stream has already been read, either from
  // this function or by .getBody()
  getReadStream(
    ..._: M extends MethodWithBody ? [] : [ERROR: 'NO_BODY_ALLOWED_FOR_METHOD']
  ): Readable {
    // TODO
    throw new Error('Unable to get stream from body');
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
      return JSON.parse(buffer.toString('utf8'));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new HttpError({
        status: 400,
        message: `Invalid request body: ${message}`,
      });
    }
  }

  private async getBody() {
    const { headers } = this;
    // TODO: Move this contentLength check into the underlying Request or Body
    // Then we can factor out the error handling and move the try/catch into text/json
    const contentLength = headers.get('content-length');
    const expectedLength = contentLength ? Number(contentLength) | 0 : null;
    let body;
    try {
      body = await this.request.readAll();
    } catch (e) {
      if (e instanceof Error && e.name === 'MaxSizeExceededError') {
        throw new HttpError(TOO_LARGE);
      }
      throw e;
    }
    if (expectedLength != null && expectedLength !== body.length) {
      throw new HttpError(SIZE_MISMATCH);
    }
    return body;
  }
}
