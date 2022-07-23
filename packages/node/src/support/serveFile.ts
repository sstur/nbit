import { createReadStream } from 'fs';
import { stat as statAsync } from 'fs/promises';
import { type Readable } from 'stream';

import { tryAsync } from '../core/support/tryAsync';
import { computeHeaders } from '../core/support/fileServing';
import type { StaticFileOptions } from '../core/StaticFile';
import { type Headers } from '../Headers';

type FileResponse = {
  status?: number | undefined;
  headers?: Record<string, string>;
  readStream?: Readable;
};

export async function serveFile(
  requestHeaders: Headers,
  fullFilePath: string,
  options: StaticFileOptions = {},
): Promise<FileResponse | null> {
  const fileStats = await tryAsync(() => statAsync(fullFilePath));
  if (!fileStats || !fileStats.isFile()) {
    return null;
  }
  const result = await computeHeaders(
    requestHeaders,
    fullFilePath,
    fileStats,
    options,
  );
  if (result == null || result.status === 304) {
    return result;
  }
  return {
    ...result,
    readStream: createReadStream(fullFilePath),
  };
}
