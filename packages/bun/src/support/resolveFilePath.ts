import { join, resolve } from 'path';

import type { FileServingOptions } from '../types';

export function resolveFilePath(filePath: string, options: FileServingOptions) {
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
