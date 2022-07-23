import { type Stats } from 'fs';
import { extname } from 'path';

import { type FileBlob } from 'bun';

import { getMimeTypeFromExt } from '../core/support/mimeTypes';
import { Bun } from '../builtins';
import fs from '../builtins/fs';

type IncomingHeaders = Headers;

type Response = {
  status?: number | undefined;
  headers: Record<string, string>;
  readStream: FileBlob;
};

// TODO: Deal with caching headers
export async function serveFile(
  requestHeaders: IncomingHeaders,
  fullFilePath: string,
): Promise<Response | null> {
  let fileStats;
  try {
    fileStats = await statAsync(fullFilePath);
  } catch (e) {
    return null;
  }
  if (!fileStats.isFile()) {
    return null;
  }
  const ext = extname(fullFilePath).slice(1);
  return {
    headers: {
      'Content-Length': String(fileStats.size),
      'Content-Type': getMimeTypeFromExt(ext) ?? 'application/octet-stream',
    },
    // TODO: When bun supports it, make this a real stream
    readStream: Bun.file(fullFilePath),
  };
}

function statAsync(path: string) {
  return new Promise<Stats>((resolve, reject) => {
    fs.stat(path, (error, result) => (error ? reject(error) : resolve(result)));
  });
}
