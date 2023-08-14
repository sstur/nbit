import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';

// Although web streams are available in Node from v16.5, this method is
// available only in v18 and newer.
const fromWeb: ((readableStream: ReadableStream) => Readable) | undefined =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Readable as any).fromWeb;

export function readableFromWeb(readableStream: ReadableStream) {
  if (!fromWeb) {
    throw new Error(
      'Readable.fromWeb() is only available in Node v18 and above',
    );
  }
  return fromWeb(readableStream);
}
