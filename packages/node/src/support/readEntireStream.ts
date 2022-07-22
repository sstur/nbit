import { type Readable } from 'stream';

import { defineErrors } from '../core/support/defineErrors';

type Options = {
  maxLength: number;
};

export const Errors = defineErrors({
  MaxLengthExceededError: 'Exceeded max length of {maxLength} bytes',
});

export function readEntireStream(stream: Readable, options: Options) {
  const { maxLength } = options;
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let totalLength = 0;
    stream.on('data', (data) => {
      chunks.push(data);
      totalLength += data.length;
      if (totalLength > maxLength) {
        throw new Errors.MaxLengthExceededError({ maxLength });
      }
    });
    stream.on('error', (error) => {
      reject(error);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(chunks, totalLength));
    });
  });
}
