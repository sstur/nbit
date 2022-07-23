/* eslint-disable dot-notation */
import { type Stats } from 'fs';
import { extname } from 'path';

import { type FileBlob } from 'bun';

import { getMimeTypeFromExt } from '../core/support/mimeTypes';
import Bun from '../builtins/Bun';
import fs from '../builtins/fs';

import { generateEtag, shouldSend304 } from './caching';

type FileResponse = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: FileBlob;
};

type Options = {
  maxAge?: number;
  cachingHeaders?: boolean;
};

const defaultOptions: Options = {
  cachingHeaders: true,
};

// TODO: Factor most of this logic out to core
export async function serveFile(
  requestHeaders: Headers,
  fullFilePath: string,
  options: Options = defaultOptions,
): Promise<FileResponse | null> {
  const { cachingHeaders = true, maxAge } = options;

  let fileStats;
  try {
    fileStats = await statAsync(fullFilePath);
  } catch (e) {
    return null;
  }
  if (!fileStats.isFile()) {
    return null;
  }

  const lastModified = new Date(fileStats.mtime);
  const etag = generateEtag(fileStats);

  if (cachingHeaders) {
    const send304 = shouldSend304(requestHeaders, lastModified, etag);
    if (send304) {
      return { status: 304, statusText: 'Not Modified' };
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

  return {
    headers,
    // TODO: When bun supports it, make this a real stream
    body: Bun.file(fullFilePath),
  };
}

function statAsync(path: string) {
  return new Promise<Stats>((resolve, reject) => {
    fs.stat(path, (error, result) => (error ? reject(error) : resolve(result)));
  });
}
