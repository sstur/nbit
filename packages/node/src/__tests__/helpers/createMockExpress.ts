import { Readable } from 'stream';
import EventEmitter from 'events';

import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from 'express';

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

export function createMockExpress(path: string, init?: RequestInit) {
  // This is used to emit an `end` event whenever the test request is "over",
  // meaning we're ready to start making assertions. This is communicated to the
  // caller via a promise. This does not necessarily indicate that the request
  // was handled or ended, it could mean that next() was called or something
  // threw.
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
  const req: ExpressRequest = Object.assign(toStream(init?.body ?? ''), {
    method: init?.method ?? 'GET',
    url: path,
    headers,
    rawHeaders,
  }) as never;

  const res: ExpressResponse = Object.assign(new EventEmitter(), {
    status: vi.fn(),
    headersSent: false,
    writeHead: vi.fn().mockImplementation(() => {
      res.headersSent = true;
    }),
    write: vi.fn(),
    sendFile: vi.fn().mockImplementation(() => emitter.emit('end')),
    end: vi.fn().mockImplementation(() => emitter.emit('end')),
  }) as never;

  const next: NextFunction = vi.fn().mockImplementation((error?: unknown) => {
    setTimeout(() => {
      emitter.emit('end', error);
    });
    // This allows us to simulate if something throws. Realistically it would be
    // if some internal framework function throws, like `toNodeHeaders()` or
    // something with .pipe().
    if (Object(error).message === 'Rethrow') {
      throw error;
    }
  });
  return [req, res, next, promise] as const;
}

function toStream(body: Uint8Array | Readable | string): Readable {
  if (body instanceof Uint8Array || typeof body === 'string') {
    return Readable.from(body, { objectMode: false });
  }
  return body;
}
