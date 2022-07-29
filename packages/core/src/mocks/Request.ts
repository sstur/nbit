/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Method } from '../types';

import { Headers } from './Headers';

export class Request {
  readonly method = 'GET' as Method;
  readonly url = '/';
  readonly headers: Headers = new Headers();
  // TODO: This should be a readable stream
  readonly body = null;
  readonly bodyUsed = false;

  async arrayBuffer(): Promise<ArrayBuffer> {
    return null as any;
  }

  async text(): Promise<string> {
    return null as any;
  }

  async json<T>(): Promise<T> {
    return null as any;
  }

  // async formData(): Promise<FormData> {
  //   return null as any;
  // }

  // async blob(): Promise<Blob> {
  //   return null as any;
  // }
}
