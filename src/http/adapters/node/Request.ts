import { PassThrough as PassThroughStream } from 'stream';
import type { IncomingMessage } from 'http';

import { canHaveBody, Request as BaseRequest } from '../../Request';
import type { Method, MethodWithBody } from '../../types';

type ReadableStream = NodeJS.ReadableStream;

export class Request<
  M extends Method,
  Params extends string,
> extends BaseRequest<M, Params> {
  private request: IncomingMessage;

  constructor(request: IncomingMessage, params: Record<string, string>) {
    const { method = 'GET', headers, url = '' } = request;
    super({ method, headers, url }, params);
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
