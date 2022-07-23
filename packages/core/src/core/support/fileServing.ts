/* eslint-disable dot-notation */
import { extname } from 'path';

import type { StaticFileOptions } from '../StaticFile';
import type { Headers } from '../../applicationTypes';

import { getMimeTypeFromExt } from './mimeTypes';
import { generateEtag, shouldSend304 } from './caching';

type Result = {
  status?: 304;
  headers?: Record<string, string>;
};

export type FileStats = {
  isFile: () => boolean;
  size: number;
  mtimeMs: number;
};

const defaultOptions: StaticFileOptions = {
  cachingHeaders: true,
};

export async function computeHeaders(
  requestHeaders: Headers,
  fullFilePath: string,
  fileStats: FileStats,
  options: StaticFileOptions = defaultOptions,
): Promise<Result | null> {
  const { cachingHeaders = true, maxAge } = options;

  if (!fileStats.isFile()) {
    return null;
  }

  const lastModified = new Date(fileStats.mtimeMs);
  const etag = generateEtag(fileStats);

  if (cachingHeaders) {
    const send304 = shouldSend304(requestHeaders, lastModified, etag);
    if (send304) {
      return { status: 304 };
    }
  }

  const ext = extname(fullFilePath).slice(1);
  const headers: Record<string, string> = {
    'Content-Length': String(fileStats.size),
    'Content-Type': getMimeTypeFromExt(ext) ?? 'application/octet-stream',
  };
  if (cachingHeaders) {
    headers['ETag'] = etag;
    headers['Last-Modified'] = lastModified.toGMTString();
  }
  if (maxAge) {
    headers['Cache-Control'] = `max-age=${maxAge}`;
  }

  return { headers };
}
