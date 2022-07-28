import { type Readable } from 'stream';

import { defineErrors } from '../core/support/defineErrors';

type Options = {
  maxBufferSize: number;
};

export const Errors = defineErrors({
  MaxSizeExceededError: 'Exceeded maximum buffer size of {maxBufferSize} bytes',
});

export function readEntireStream(stream: Readable, options: Options) {
  const { maxBufferSize } = options;
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let totalBytesRead = 0;
    stream.on('data', (data) => {
      chunks.push(data);
      totalBytesRead += data.length;
      if (totalBytesRead > maxBufferSize) {
        throw new Errors.MaxSizeExceededError({ maxBufferSize });
      }
    });
    stream.on('error', (error) => {
      reject(error);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks, totalBytesRead));
    });
  });
}
