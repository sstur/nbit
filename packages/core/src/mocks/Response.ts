import type { HeadersInit } from './Headers';

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

type ResponseBody = Uint8Array | string;

export class Response {
  readonly status: number = 200;

  constructor(readonly body: ResponseBody, readonly init?: ResponseInit) {}
}
