/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  expect,
  it,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from 'bun:test';

import fs from '../builtins/fs';
import Bun from '../builtins/Bun';
import { mockMethod } from '../support/testHelpers';

Object.assign(globalThis, {
  describe,
  expect,
  it,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
});

const files = [
  {
    path: '/foo/thing.png',
    type: 'file',
    size: 42,
    mtimeMs: new Date('2019-01-01T00:00:00.000Z').valueOf(),
  },
  {
    path: './foo/dir',
    type: 'directory',
    size: 5,
    mtimeMs: new Date('2019-01-01T00:00:00.000Z').valueOf(),
  },
  {
    path: './foo/file.asdf',
    type: 'file',
    size: 15,
    mtimeMs: new Date('2019-01-01T00:00:00.000Z').valueOf(),
  },
];

mockMethod(Bun, 'file', (path) => {
  return { _stream: path } as any;
});

mockMethod(fs, 'stat', async (path) => {
  const file = files.find((file) => path === file.path);
  if (!file) {
    throw Object.assign(
      new Error(`ENOENT: no such file or directory, stat '${path}'`),
      { errno: -2, code: 'ENOENT', syscall: 'stat', path },
    );
  }
  const { type, size, mtimeMs } = file;
  return {
    isFile: () => type === 'file',
    size,
    mtimeMs,
  } as any;
});
