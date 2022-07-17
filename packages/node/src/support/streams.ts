import type { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

export function isReadStream(input: unknown): input is Readable {
  return typeof Object(input).pipe === 'function';
}

export function isWebStream(input: unknown): input is ReadableStream {
  return typeof Object(input).getReader === 'function';
}
