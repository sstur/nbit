/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: This should be available on the global object in Node v11+ but TS seems to not think so.
import { TextDecoder } from 'util';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

import { readEntireStream } from './support/readEntireStream';
import { toReadStream } from './support/streams';
import type { JSONValue } from './types';

// TODO: Include null and undefined
export type BodyInit =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | string;

// The maximum amount (bytes) we'll read into memory from a body stream.
// Defaults to 100kb, same as Express, see https://github.com/expressjs/body-parser/blob/9db582d/lib/types/json.js#L54
const MAX_BUFFER_SIZE = 100 * 1024;

export type Options = {
  expectedSize?: number | undefined;
  maxBufferSize?: number | undefined;
};

export class Body {
  private _body: BodyInit | null;
  private _bodyUsed = false;
  private _options: Options;

  constructor(body: BodyInit | null, options?: Options) {
    this._body = body;
    this._options = options ?? {};
  }

  get body() {
    return this._body;
  }

  get bodyUsed() {
    const body = this._body;
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
      // If it's an IncomingMessage, so we can rely on the _consuming field
      const consuming = Object(body)._consuming;
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

  private async buffer(methodName: string): Promise<Buffer> {
    if (this.bodyUsed) {
      const className = this.constructor.name;
      throw new TypeError(
        `TypeError: Failed to execute '${methodName}' on '${className}': body stream already read`,
      );
    }
    const body = this._body;
    if (body == null) {
      return Buffer.from('');
    }
    this._bodyUsed = true;
    if (body instanceof Uint8Array) {
      return Buffer.isBuffer(body) ? body : Buffer.from(body.buffer);
    }
    if (typeof body === 'string') {
      return Buffer.from(body);
    }
    const expectedSize = this._options.expectedSize;
    const maxBufferSize = this._options.maxBufferSize ?? MAX_BUFFER_SIZE;
    const buffer = await readEntireStream(toReadStream(body), {
      expectedSize,
      maxBufferSize,
    });
    this._body = buffer;
    return buffer;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const { buffer } = await this.buffer('arrayBuffer');
    return buffer;
  }

  async text(): Promise<string> {
    const body = await this.buffer('text');
    return toString(body);
  }

  async json<T = JSONValue>(): Promise<T> {
    const body = await this.buffer('json');
    return JSON.parse(toString(body)) as any;
  }
}

function toString(body: string | Uint8Array): string {
  return body instanceof Uint8Array ? new TextDecoder().decode(body) : body;
}
