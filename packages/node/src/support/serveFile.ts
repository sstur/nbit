import { createReadStream } from 'fs';
import { stat as statAsync } from 'fs/promises';
import { type Readable } from 'stream';

import { tryAsync } from '../core/support/tryAsync';
import { computeHeaders } from '../fs';
import type { StaticFileOptions } from '../core/StaticFile';
import type { Headers } from '../web-io';

type FileResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: Readable;
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
    headers: result.headers,
    body: createReadStream(fullFilePath),
  };
}
