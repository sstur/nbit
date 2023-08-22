import { Readable } from 'stream';
import EventEmitter from 'events';
import type { IncomingMessage, ServerResponse } from 'http';

type BodyInit =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | Readable
  | string
  | null
  | undefined;

type RequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
};

export function createMockNode(path: string, init?: RequestInit) {
  // This is used to emit an `end` event whenever the test request is "over",
  // meaning we're ready to start making assertions. This is communicated to the
  // caller via a promise. This does not necessarily indicate that the request
  // was handled or ended, it could mean that something threw.
  const emitter = new EventEmitter();
  const promise = new Promise<unknown>((resolve) => {
    emitter.on('end', (error?: unknown) => resolve(error));
  });
  const headers: Record<string, string> = init?.headers ?? {};
  const rawHeaders: Array<string> = [];
  for (const [key, value] of Object.entries(headers)) {
    rawHeaders.push(key);
    rawHeaders.push(value);
  }
  const req: IncomingMessage = Object.assign(toStream(init?.body ?? ''), {
    method: init?.method ?? 'GET',
    url: path,
    headers,
    rawHeaders,
  }) as never;

  let hasThrown = false;
  const res: ServerResponse = Object.assign(new EventEmitter(), {
    status: vi.fn(),
    headersSent: false,
    writeHead: vi.fn().mockImplementation(() => {
      // This allows us to simulate if something right before/during writeHead
      // throws. Realistically it would be if some internal framework function
      // throws, like `toNodeHeaders()` or something with .pipe().
      // We will throw only on the first call to writeHead().
      // TODO: A less hacky way might be to mock toNodeHeaders and make it
      // throw, because in reality, writeHead should never throw.
      const toBeThrown = init?.headers?.throw;
      if (toBeThrown && !hasThrown) {
        hasThrown = true;
        setTimeout(() => {
          emitter.emit('end');
        });
        throw new Error(toBeThrown);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Readonly property
      res.headersSent = true;
    }),
    write: vi.fn(),
    sendFile: vi.fn().mockImplementation(() => emitter.emit('end')),
    end: vi.fn().mockImplementation(() => emitter.emit('end')),
  }) as never;
  return [req, res, promise] as const;
}

function toStream(body: Uint8Array | Readable | string): Readable {
  if (body instanceof Uint8Array || typeof body === 'string') {
    return Readable.from(body, { objectMode: false });
  }
  return body;
}
