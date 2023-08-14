import { type Readable } from 'stream';

import { defineErrors } from '../core/support/defineErrors';

type Options = {
  expectedSize: number | undefined;
  maxBufferSize: number;
};

export const Errors = defineErrors({
  ExpectedSizeMismatchError:
    'Expected {expected} bytes but received {received}',
  MaxSizeExceededError: 'Exceeded maximum buffer size of {maxBufferSize} bytes',
});

// There are two potential opportunities for early return here: (1) check
// content-length against maxBufferSize before we begin and throw
// MaxSizeExceededError if it's too large; (2) on each chunk received check
// totalBytes and throw ExpectedSizeMismatchError if it exceeds expectedSize.
export function readEntireStream(stream: Readable, options: Options) {
  const { expectedSize, maxBufferSize } = options;
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let totalBytesRead = 0;
    stream.on('data', (data) => {
      chunks.push(data);
      totalBytesRead += data.length;
      if (totalBytesRead > maxBufferSize) {
        const error = new Errors.MaxSizeExceededError({ maxBufferSize });
        reject(error);
      }
    });
    stream.on('error', (error) => {
      reject(error);
    });
    stream.on('end', () => {
      if (expectedSize !== undefined && totalBytesRead !== expectedSize) {
        const error = new Errors.ExpectedSizeMismatchError({
          expected: expectedSize,
          received: totalBytesRead,
        });
        reject(error);
        return;
      }
      try {
        resolve(Buffer.concat(chunks, totalBytesRead));
      } catch (e) {
        reject(e);
      }
    });
  });
}
