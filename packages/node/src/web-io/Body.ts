/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextDecoder } from 'util';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

import { readEntireStream } from '../support/readEntireStream';
import { readableFromWeb } from '../support/streams';

export type BodyInit =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | URLSearchParams
  | string
  | null
  | undefined;

type BodyInitNormalized = Uint8Array | Readable | string | null;

// The maximum amount (bytes) we'll read into memory from a body stream.
// Defaults to 100kb, same as Express, see https://github.com/expressjs/body-parser/blob/9db582d/lib/types/json.js#L54
const MAX_BUFFER_SIZE = 100 * 1024;

export type Options = {
  expectedSize?: number | undefined;
  maxBufferSize?: number | undefined;
  /**
   * This allows us to catch an error that occurs while reading the body and
   * convert it to a more use-case appropriate error like an HttpError
   */
  onReadError?: (error: Error) => Error;
};

export class Body {
  private _bodyInit: BodyInitNormalized;
  private _bodyStream: Readable | undefined;
  private _bodyUsed = false;
  private options: Options;

  constructor(body: BodyInit, options?: Options) {
    this._bodyInit = normalizeBody(body);
    this.options = options ?? {};
  }

  // TODO: This is `Readable | null` but it should be `Readable` to allow request.body.pipe(...)
  get body() {
    if (this._bodyStream) {
      return this._bodyStream;
    }
    const body = this._bodyInit;
    if (body == null) {
      return null;
    }
    return (this._bodyStream = toStream(body));
  }

  /**
   * Non-standard getter for fast-path handling of non-stream response body
   */
  get bodyRaw() {
    const body = this._bodyInit;
    if (
      body == null ||
      body instanceof Uint8Array ||
      typeof body === 'string'
    ) {
      return body;
    }
    return this.body;
  }

  get bodyUsed() {
    const body = this._bodyInit;
    if (body == null) {
      return false;
    }
    if (
      this._bodyUsed ||
      body instanceof Uint8Array ||
      typeof body === 'string'
    ) {
      return this._bodyUsed;
    }
    if (body instanceof Readable) {
      // In Node v16.8+ we can rely on Readable.isDisturbed()
      if (Readable.isDisturbed) {
        return Readable.isDisturbed(body);
      }
      // In Node v14.18+ we can rely on stream.readableDidRead
      // https://nodejs.org/docs/latest-v14.x/api/stream.html#stream_readable_readabledidread
      const { readableDidRead } = body;
      if (typeof readableDidRead === 'boolean') {
        return readableDidRead;
      }
      // If it's an IncomingMessage, we can rely on the _consuming field
      const consuming = (body as any)._consuming as unknown;
      if (typeof consuming === 'boolean') {
        return consuming;
      }
      // If nothing else, we'll rely on our own internal flag
      return this._bodyUsed;
    }
    // For Web Streams (Node v16.5+) we'll rely on Readable.isDisturbed() if
    // available (Node v16.8+) otherwise fall back to our own internal flag.
    if (Readable.isDisturbed) {
      return Readable.isDisturbed(body as any);
    }
    return this._bodyUsed;
  }

  private async consumeBody(methodName: string): Promise<Buffer> {
    if (this.bodyUsed) {
      const className = this.constructor.name;
      throw new TypeError(
        `TypeError: Failed to execute '${methodName}' on '${className}': body stream already read`,
      );
    }
    const body = this.body;
    if (body == null) {
      return Buffer.from('');
    }
    this._bodyUsed = true;
    const {
      expectedSize,
      maxBufferSize = MAX_BUFFER_SIZE,
      onReadError,
    } = this.options;
    try {
      return await readEntireStream(body, {
        expectedSize,
        maxBufferSize,
      });
    } catch (e) {
      if (e instanceof Error && onReadError) {
        throw onReadError(e);
      }
      throw e;
    }
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer } = await this.consumeBody('arrayBuffer');
    return buffer;
  }

  async text(): Promise<string> {
    const body = await this.consumeBody('text');
    return toString(body);
  }

  async json<T = unknown>(): Promise<T> {
    const body = await this.consumeBody('json');
    return JSON.parse(toString(body)) as any;
  }
}

function normalizeBody(body: BodyInit): BodyInitNormalized {
  if (
    !body ||
    typeof body === 'string' ||
    body instanceof Uint8Array ||
    body instanceof Readable
  ) {
    return body ?? null;
  }
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  return readableFromWeb(body);
}

function toStream(body: Uint8Array | Readable | string): Readable {
  if (body instanceof Uint8Array || typeof body === 'string') {
    return Readable.from(body, { objectMode: false });
  }
  return body;
}

function toString(body: Uint8Array): string {
  return new TextDecoder().decode(body);
}
