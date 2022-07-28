// TODO: This should be available on the global object in Node v11+ but TS seems to not think so.
import { TextDecoder } from 'util';
import type { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

import type { JSONValue } from '../types';
import { readEntireStream } from '../support/readEntireStream';
import { toReadStream } from '../support/streams';

export type BodyInit =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable // Traditional Node Streams API
  | ReadableStream // New Web Streams API (since Node 16.5)
  | string;

// The maximum amount (bytes) we'll read into memory from a body stream.
// Defaults to 100kb, same as Express, see https://github.com/expressjs/body-parser/blob/9db582d/lib/types/json.js#L54
const MAX_BUFFER_SIZE = 100 * 1024;

export type Options = {
  maxBufferSize?: number;
};

export class Body {
  private _body: BodyInit | null;
  private options: Options;

  constructor(body: BodyInit | null, options?: Options) {
    this._body = body;
    this.options = options ?? {};
  }

  get body() {
    return this._body;
  }

  async readAll(): Promise<Buffer> {
    const body = this._body;
    if (body == null) {
      return Buffer.from('');
    }
    if (body instanceof Uint8Array) {
      return Buffer.isBuffer(body) ? body : Buffer.from(body);
    }
    if (typeof body === 'string') {
      return Buffer.from(body);
    }
    const maxBufferSize = this.options.maxBufferSize ?? MAX_BUFFER_SIZE;
    const buffer = await readEntireStream(toReadStream(body), {
      maxBufferSize,
    });
    this._body = buffer;
    return buffer;
  }

  async text(): Promise<string> {
    const body = await this.readAll();
    return toString(body);
  }

  async json(): Promise<JSONValue> {
    if (this._body == null) {
      return null;
    }
    const text = await this.text();
    return JSON.parse(text);
  }
}

function toString(body: string | Uint8Array): string {
  return body instanceof Uint8Array ? new TextDecoder().decode(body) : body;
}
