import { PassThrough as PassThroughStream } from 'stream';
import type { IncomingMessage } from 'http';

import { canHaveBody, Request as BaseRequest } from '../../Request';
import type { Method, MethodWithBody } from '../../types';

type ReadableStream = NodeJS.ReadableStream;

// This is required by `new URL()` for parsing but it doesn't matter what value
// this has since it's not used.
// See: https://nodejs.org/docs/latest-v12.x/api/url.html#url_url
const URL_BASE = 'https://0.0.0.0';

export class Request<
  M extends Method,
  Params extends string,
> extends BaseRequest<M, Params> {
  private request: IncomingMessage;

  constructor(request: IncomingMessage, params: Record<string, string>) {
    const { method = 'GET' } = request;
    const url = new URL(request.url ?? '', URL_BASE);
    // TODO: Is there a more performant way to populate the request headers?
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (value != null) {
        for (let header of Array.isArray(value) ? value : [value]) {
          headers.append(name, header);
        }
      }
    }
    super(url.toString(), { method, headers });
    // @ts-expect-error - TODO: Find a better way to instantiate params
    this.params = params;
    this.request = request;
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
