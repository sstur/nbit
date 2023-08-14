import { TextEncoder } from 'util';
import { Readable } from 'stream';

import { Body } from '../Body';

describe('Body', () => {
  it('should initialize with null', async () => {
    const body = new Body(null);
    expect(body.bodyRaw).toBe(null);
    expect(body.body).toBe(null);
    const text = await body.text();
    expect(text).toBe('');
  });

  it('should initialize with undefined', async () => {
    const body = new Body(undefined);
    expect(body.bodyRaw).toBe(null);
    expect(body.body).toBe(null);
    const text = await body.text();
    expect(text).toBe('');
  });

  it('should initialize with string', async () => {
    const body = new Body('Hello world');
    expect(body.bodyRaw).toBe('Hello world');
    expect(body.body).toBeInstanceOf(Readable);
    const text = await body.text();
    expect(text).toBe('Hello world');
  });

  it('should initialize with buffer', async () => {
    const body = new Body(Buffer.from('Hello world'));
    expect(body.bodyRaw).toBeInstanceOf(Buffer);
    expect(body.body).toBeInstanceOf(Readable);
    const text = await body.text();
    expect(text).toBe('Hello world');
  });

  it('should initialize with readable stream', async () => {
    const body = new Body(Readable.from('Hello world', { objectMode: false }));
    expect(body.bodyRaw).toBeInstanceOf(Readable);
    expect(body.body).toBeInstanceOf(Readable);
    const text = await body.text();
    expect(text).toBe('Hello world');
  });

  const nodeVersionMajor = Number(process.version.slice(1).split('.')[0]);

  if (nodeVersionMajor < 16) {
    it('should not support web stream (Node v14)', async () => {
      expect(() => {
        createReadableStream('Hello world');
      }).toThrow(`Cannot find module 'stream/web'`);
    });
  }

  if (nodeVersionMajor === 16) {
    it('should throw on web stream (Node v16)', async () => {
      const readableStream = createReadableStream('Hello world');
      expect(() => {
        // eslint-disable-next-line no-new
        new Body(readableStream);
      }).toThrow('Readable.fromWeb() is only available in Node v18 and above');
    });
  }

  if (nodeVersionMajor >= 18) {
    it('should initialize with web stream (Node v18+)', async () => {
      const readableStream = createReadableStream('Hello world');
      const body = new Body(readableStream);
      expect(body.bodyRaw).toBeInstanceOf(Readable);
      expect(body.body).toBeInstanceOf(Readable);
      const text = await body.text();
      expect(text).toBe('Hello world');
    });
  }
});

function createReadableStream(string: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ReadableStream } = require('stream/web');
  const encoder = new TextEncoder();

  return new ReadableStream({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    start(controller: any) {
      controller.enqueue(encoder.encode(string));
      controller.close();
    },
  });
}
