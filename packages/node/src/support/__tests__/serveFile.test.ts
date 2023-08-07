/* eslint-disable @typescript-eslint/no-explicit-any */
import { serveFile } from '../serveFile';
import { Headers } from '../../Headers';

vi.mock('fs', async (importOriginal) => {
  const fs = await importOriginal();
  return {
    ...Object(fs),
    createReadStream: vi.fn().mockImplementation((filePath) => {
      return { _stream: filePath } as any;
    }),
  };
});

vi.mock('fs/promises', async (importOriginal) => {
  const fs = await importOriginal();
  return {
    ...Object(fs),
    stat: vi.fn().mockImplementation(async (path) => {
      const fileName = path.split('/').pop().split('.')[0] ?? '';
      const parts = fileName.split('-').slice(1);
      if (!parts.length) {
        throw new Error('ENOENT: no such file or directory');
      }
      const [size, isFile] = parts;
      return mockStat(Number(size), Boolean(Number(isFile)));
    }),
  };
});

describe('serveFile', () => {
  it('should serve a file that exists', async () => {
    const filePath = '/foo/thing-42-1.png';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual({
      headers: {
        'Content-Length': '42',
        'Content-Type': 'image/png',
        ETag: 'W/"2a16806b5bc00"',
        'Last-Modified': 'Tue, 01 Jan 2019 00:00:00 GMT',
      },
      body: { _stream: filePath },
    });
  });

  it('should return null if the file does not exist', async () => {
    const filePath = './foo.txt';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual(null);
  });

  it('should return null if the entry at path is not a file', async () => {
    const filePath = './foo/dir-5-0';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual(null);
  });

  it('should fall back to default content type', async () => {
    const filePath = './foo/file-15-1.asdf';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual({
      headers: {
        'Content-Length': '15',
        'Content-Type': 'application/octet-stream',
        ETag: 'W/"f16806b5bc00"',
        'Last-Modified': 'Tue, 01 Jan 2019 00:00:00 GMT',
      },
      body: { _stream: filePath },
    });
  });
});

function mockStat(size: number, isFile: boolean) {
  return {
    size,
    mtimeMs: new Date('2019-01-01T00:00:00.000Z').valueOf(),
    isFile: () => isFile,
  };
}
