import { type FileBlob } from 'bun';

import fs from '../builtins/fs';
import Bun from '../builtins/Bun';
import { computeHeaders } from '../fs';
import { tryAsync } from '../core/support/tryAsync';
import type { StaticFileOptions } from '../core/StaticFile';

type FileResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: FileBlob;
};

// This implementation is identical to that of node, except it returns a
// Bun.file() instead of a ReadableStream which is more performant according to
// Bun docs.
export async function serveFile(
  requestHeaders: Headers,
  fullFilePath: string,
  options: StaticFileOptions = {},
): Promise<FileResponse | null> {
  const fileStats = await tryAsync(() => fs.stat(fullFilePath));
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
    body: Bun.file(fullFilePath),
  };
}
