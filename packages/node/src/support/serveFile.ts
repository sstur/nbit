import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { extname } from 'path';
import { type Readable } from 'stream';

import { getMimeTypeFromExt } from '../core/support/mimeTypes';

type IncomingHeaders = Record<string, string | Array<string> | undefined>;

type Response = {
  status?: number | undefined;
  headers: Record<string, string>;
  readStream: Readable;
};

// TODO: Deal with caching headers
export async function serveFile(
  requestHeaders: IncomingHeaders,
  fullFilePath: string,
): Promise<Response | null> {
  let fileStats;
  try {
    fileStats = await stat(fullFilePath);
  } catch (e) {
    return null;
  }
  if (!fileStats.isFile()) {
    return null;
  }
  const ext = extname(fullFilePath).slice(1);
  const readStream = createReadStream(fullFilePath);
  return {
    headers: {
      'Content-Length': String(fileStats.size),
      'Content-Type': getMimeTypeFromExt(ext) ?? 'application/octet-stream',
    },
    readStream,
  };
}
