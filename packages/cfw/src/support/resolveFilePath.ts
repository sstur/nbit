import type { FileServingOptions } from '../types';

import { join, resolve } from './path';

export function resolveFilePath(filePath: string, options: FileServingOptions) {
  const { root = '/', allowStaticFrom = [] } = options;
  const projectRoot = resolve(root);
  const fullFilePath = join(projectRoot, filePath);
  for (const allowedPath of allowStaticFrom) {
    const fullAllowedPath = join(root, allowedPath);
    if (fullFilePath.startsWith(fullAllowedPath + '/')) {
      return [fullFilePath, allowedPath] as const;
    }
  }
  return null;
}
