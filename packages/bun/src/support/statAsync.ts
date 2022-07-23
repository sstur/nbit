import { type Stats } from 'fs';

import fs from '../builtins/fs';

/** A promisified version of fs.stat() */
export function statAsync(path: string) {
  return new Promise<Stats>((resolve, reject) => {
    fs.stat(path, (error, result) => (error ? reject(error) : resolve(result)));
  });
}
