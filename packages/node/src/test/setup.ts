import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { resolve } from 'path';
import { Readable } from 'stream';

vi.mock('fs');
vi.mock('fs/promises');

let cwd = '/';

const files = [
  {
    path: 'public/foo.txt',
    type: 'file',
    content: 'Some content',
    mtime: 1692735819,
  },
];

vi.spyOn(process, 'cwd').mockImplementation(() => {
  return cwd;
});

vi.spyOn(process, 'chdir').mockImplementation((path: string) => {
  cwd = resolve(cwd, path);
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
vi.spyOn(fsp, 'stat').mockImplementation(async (path: string) => {
  const fullPath = resolve(cwd, path);
  const file = files.find((file) => fullPath === resolve(cwd, file.path));
  if (!file) {
    throw Object.assign(
      new Error(`ENOENT: no such file or directory, stat '${path}'`),
      { errno: -2, code: 'ENOENT', syscall: 'stat', path },
    );
  }
  const { type, content, mtime } = file;
  return {
    isFile: () => type === 'file',
    size: content.length,
    mtimeMs: mtime * 1000,
  };
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
vi.spyOn(fs, 'createReadStream').mockImplementation((path: string) => {
  const fullPath = resolve(cwd, path);
  const file = files.find((file) => fullPath === resolve(cwd, file.path));
  if (!file) {
    return new Readable({
      read() {
        this.emit(
          'error',
          Object.assign(
            new Error(`ENOENT: no such file or directory, open '${path}'`),
            { errno: -2, code: 'ENOENT', syscall: 'open', path },
          ),
        );
        this.push(null);
      },
    });
  }
  return Readable.from(file.content, { objectMode: false });
});
