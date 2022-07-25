import { join, resolve } from 'path';

import type { FileServingOptions } from '../../types';

export function resolveFilePath(filePath: string, options: FileServingOptions) {
  const { root = process.cwd(), allowStaticFrom = [] } = options;
  const projectRoot = resolve(root);
  const fullFilePath = join(projectRoot, filePath);
  for (let allowedPath of allowStaticFrom) {
    const fullAllowedPath = join(root, allowedPath);
    if (fullFilePath.startsWith(fullAllowedPath + '/')) {
      return [fullFilePath, allowedPath] as const;
    }
  }
  return null;
}
