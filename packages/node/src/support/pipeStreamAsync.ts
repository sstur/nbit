import type { Readable, Writable } from 'stream';

export function pipeStreamAsync(
  readStream: Readable,
  writeStream: Writable,
  options: { beforeFirstWrite: () => void },
): Promise<void> {
  const { beforeFirstWrite } = options;
  return new Promise((resolve, reject) => {
    readStream
      .once('data', () => {
        try {
          beforeFirstWrite();
        } catch (e) {
          try {
            readStream.unpipe(writeStream);
          } catch (_) {}
          reject(e);
        }
      })
      .pipe(writeStream)
      .on('close', () => resolve())
      .on('error', (error) => {
        readStream.off('data', beforeFirstWrite);
        reject(error);
      });
  });
}
