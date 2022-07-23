import type { HeadersInit } from './Headers';

export type ResponseInit = {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
};

export class Response {
  readonly status: number = 200;
}
