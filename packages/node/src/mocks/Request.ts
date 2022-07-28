/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: This should be available on the global object in Node v11+ but TS seems to not think so.
import { TextDecoder } from 'util';

import { canHaveBody } from '../core';
import { Headers, type HeadersInit } from '../Headers';
import type { JSONValue, Method, MethodWithBody } from '../types';

type Body = string | Uint8Array;

type RequestInit<M extends Method> = {
  method?: M;
  headers?: HeadersInit;
  body?: M extends MethodWithBody ? Body : null;
};

export class Request<M extends Method = 'GET'> {
  readonly method: M;
  readonly url: string;
  readonly headers: Headers;
  readonly body: Body;

  constructor(url: string, init?: RequestInit<M>) {
    this.url = url;
    this.method = init?.method ?? ('GET' as M);
    this.headers = new Headers(init?.headers);
    this.body = init?.body ?? (null as any);
  }

  text(): M extends MethodWithBody ? Promise<string> : never {
    const { method, body } = this;
    if (!canHaveBody(method)) {
      throw new Error(`Cannot read body on request with method ${method}`);
    }
    const result = body == null ? '' : toString(body);
    return Promise.resolve(result) as any;
  }

  json(): M extends MethodWithBody ? Promise<JSONValue> : never {
    const { method, body } = this;
    if (!canHaveBody(method)) {
      throw new Error(`Cannot read body on request with method ${method}`);
    }
    const result = body == null ? null : JSON.parse(toString(body));
    return Promise.resolve(result) as any;
  }
}

export class CustomRequest<M extends Method, Params extends string> {
  private request: Request<M>;
  readonly method: M;
  readonly path: string;
  readonly search: string;
  readonly query: URLSearchParams;
  readonly headers: Headers;
  readonly params: { [K in Params]: string };

  constructor(request: Request<M>, params: Record<Params, string>) {
    this.request = request;
    const { method, url, headers } = request;
    this.method = method as M;
    const { pathname, search, searchParams } = new URL(url);
    this.path = pathname;
    this.search = search;
    this.query = searchParams;
    this.headers = headers;
    this.params = params;
  }

  text(): M extends MethodWithBody ? Promise<string> : null {
    return this.request.text() as any;
  }

  json(): M extends MethodWithBody ? Promise<JSONValue> : never {
    if (!canHaveBody(this.method)) {
      return null as never;
    }
    return this.request.json() as any;
  }
}

function toString(body: string | Uint8Array): string {
  return body instanceof Uint8Array ? new TextDecoder().decode(body) : body;
}
