import { type FileBlob } from 'bun';

import Bun from '../builtins/Bun';
import { tryAsync } from '../core/support/tryAsync';
import { computeHeaders } from '../core/support/fileServing';
import type { StaticFileOptions } from '../core/StaticFile';

import { statAsync } from './statAsync';

type FileResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: FileBlob;
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
    // TODO: When bun supports it, make this a real stream
    body: Bun.file(fullFilePath),
  };
}
