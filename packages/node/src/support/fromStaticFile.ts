import { Response } from '../Response';
import { resolveFilePath } from '../fs';
import { Headers } from '../Headers';
import type { StaticFile } from '../core/StaticFile';
import type { FileServingOptions } from '../types';

import { serveFile } from './serveFile';

export async function fromStaticFile(
  requestHeaders: Headers,
  file: StaticFile,
  fileServingOptions: FileServingOptions,
): Promise<Response | undefined> {
  const { filePath, options, responseInit: init } = file;
  const resolved = resolveFilePath(filePath, fileServingOptions);
  if (!resolved) {
    return;
  }
  const [fullFilePath] = resolved;
  const fileResponse = await serveFile(requestHeaders, fullFilePath, options);
  if (!fileResponse) {
    return;
  }
  // Use the status from fileResponse if provided (e.g. "304 Not Modified")
  // otherwise fall back to user-specified value or default.
  const responseStatus = fileResponse.status ?? init.status ?? 200;
  const responseHeaders = new Headers(init.headers);
  // Merge in the headers without overwriting existing headers
  for (const [key, value] of Object.entries(fileResponse.headers ?? {})) {
    if (!responseHeaders.has(key)) {
      responseHeaders.set(key, value);
    }
  }
  return new Response(fileResponse.body ?? '', {
    ...init,
    status: responseStatus,
    headers: responseHeaders,
  });
}
