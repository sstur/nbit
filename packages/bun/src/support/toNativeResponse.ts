import { join, resolve } from 'path';

import { isStaticFile, type Response as WrappedResponse } from '../Response';
import { Response } from '../builtins';
import type { FileServingOptions } from '../types';

function resolveFilePath(filePath: string, options: FileServingOptions) {
  const root = resolve(options.root ?? process.cwd());
  const allowStaticFrom = options.allowStaticFrom ?? [];
  const fullFilePath = join(root, filePath);
  for (let allowedPath of allowStaticFrom) {
    const fullAllowedPath = join(root, allowedPath);
    if (fullFilePath.startsWith(fullAllowedPath + '/')) {
      return fullFilePath;
    }
  }
  return null;
}

export function toNativeResponse(
  response: WrappedResponse,
  options: FileServingOptions,
) {
  // TODO: statusText
  const { body, status, headers } = response;
  if (isStaticFile(body)) {
    const { filePath } = body;
    const fullFilePath = resolveFilePath(filePath, options);
    if (fullFilePath == null) {
      // TODO: Better error
      return new Response('Unable to serve file', { status: 403 });
    }
    // TODO: Deal with caching headers
    // TODO: Ensure file exists
    return new Response(Bun.file(fullFilePath));
  } else {
    return new Response(body, { status, headers });
  }
}
