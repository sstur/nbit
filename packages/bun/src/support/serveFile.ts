import { type FileBlob } from 'bun';

import Bun from '../builtins/Bun';
import { tryAsync } from '../core/support/tryAsync';
import { computeHeaders } from '../fs';
import type { StaticFileOptions } from '../core/StaticFile';

import { statAsync } from './statAsync';

type FileResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: FileBlob;
};

// This implementation is identical to that of node, except it uses a custom
// statAsync (which should be no longer necessary) and returns a Bun.file()
// instead of a ReadableStream (more performant according to Bun docs).
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
    // TODO: When bun supports it, make this a real stream
    body: Bun.file(fullFilePath),
  };
}
