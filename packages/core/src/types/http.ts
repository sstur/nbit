import type { Response } from '../applicationTypes';
import type { StaticFile } from '../core/StaticFile';
import type { CustomRequest } from '../core/CustomRequest';

import type { LooseUnion } from './utilities';

export type RequestOptions = {
  /**
   * The max number of bytes that will be buffered into memory when parsing a
   * request body into a format such as JSON.
   */
  bodyParserMaxBufferSize?: number;
};

export type ResponseOptions = {
  /**
   * This error handler, if specified, will be used to generate a response when
   * an exception was raised during the execution of any of the handlers.
   */
  errorHandler?: (error: Error) => MaybePromise<Response>;
};

export type FileServingOptions = {
  /**
   * The root from which file names will be resolved when serving files.
   * Defaults to current working directory.
   */
  root?: string;
  /**
   * An array of paths (relative to root) from which static files are _allowed_
   * to be served.
   */
  allowStaticFrom?: Array<string>;
};

export type MaybePromise<T> = T | Promise<T>;

export type MaybeIntersect<T, U> = U extends undefined ? T : T & U;

type JsonPayload = Record<string, unknown> | Array<unknown>;

type ExtractParams<T extends string> = string extends T
  ? never
  : T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? Param | ExtractParams<Rest>
  : T extends `${infer _Start}:${infer Param}`
  ? Param
  : never;

// List of known methods for auto-complete
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Using exclude here to flatten for readability
type MethodOrWildcard = Exclude<Method | '*', ''>;

export type MethodAny = LooseUnion<MethodOrWildcard>;

export type MethodNoBody = Exclude<Method, 'POST' | 'PUT'>;

export type Handler<M extends MethodAny, P extends string, RequestContext> = (
  request: MaybeIntersect<CustomRequest<M, ExtractParams<P>>, RequestContext>,
) => MaybePromise<
  Response | StaticFile | JsonPayload | null | undefined | void
>;

export type Route<RequestContext> = [
  MethodAny,
  string,
  Handler<MethodAny, string, RequestContext>,
];
