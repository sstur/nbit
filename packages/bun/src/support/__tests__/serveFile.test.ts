import { serveFile } from '../serveFile';

describe('serveFile', () => {
  it('should serve a file that exists', async () => {
    const filePath = '/foo/thing.png';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual({
      headers: {
        'Content-Length': '42',
        'Content-Type': 'image/png',
        ETag: 'W/"2a16806b5bc00"',
        'Last-Modified': 'Tue, 01 Jan 2019 00:00:00 GMT',
      },
      body: { _stream: '/foo/thing.png' },
    });
  });

  it('should return null if the file does not exist', async () => {
    const filePath = './foo.txt';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toBe(null);
  });

  it('should return null if the entry at path is not a file', async () => {
    const filePath = './foo/dir';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toBe(null);
  });

  it('should fall back to default content type', async () => {
    const filePath = './foo/file.asdf';
    const result = await serveFile(new Headers(), filePath);
    expect(result).toEqual({
      headers: {
        'Content-Length': '15',
        'Content-Type': 'application/octet-stream',
        ETag: 'W/"f16806b5bc00"',
        'Last-Modified': 'Tue, 01 Jan 2019 00:00:00 GMT',
      },
      body: { _stream: './foo/file.asdf' },
    });
  });
});
