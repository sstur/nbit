import type { Request } from './Request';
import type { Response } from './Response';

type MaybePromise<T> = T | Promise<T>;

type JsonPayload = Record<string, unknown> | Array<unknown>;

type ExtractParams<T extends string> = string extends T
  ? never
  : T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? Param | ExtractParams<Rest>
  : T extends `${infer _Start}:${infer Param}`
  ? Param
  : never;

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type MethodWithBody = 'POST' | 'PUT';

export type Handler<M extends Method, P extends string> = (
  request: Request<M, ExtractParams<P>>,
) => MaybePromise<Response | JsonPayload | null | undefined>;

export type Route = [Method, string, Handler<Method, string>];
