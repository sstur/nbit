import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

export function isReadable(input: unknown): input is Readable | ReadableStream {
  return isLegacyReadableStream(input) || isWebReadableStream(input);
}

export function toReadStream(input: Readable | ReadableStream): Readable {
  return isWebReadableStream(input) ? Readable.fromWeb(input) : input;
}

function isLegacyReadableStream(input: unknown): input is Readable {
  return input instanceof Readable;
}

function isWebReadableStream(input: unknown): input is ReadableStream {
  // It's important that we don't use `instanceof` here because that would throw
  // in versions of Node (< 16.5) that don't have web streams.
  return typeof Object(input).getReader === 'function';
}
