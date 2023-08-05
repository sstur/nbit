import type { Response } from '../applicationTypes';
import type { StaticFile } from '../core/StaticFile';
import type { CustomRequest } from '../core/CustomRequest';

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

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type MethodWithWildcard = Method | '*';

export type MethodHasBody = 'POST' | 'PUT';

export type Handler<
  M extends MethodWithWildcard,
  P extends string,
  RequestContext,
> = (
  request: MaybeIntersect<
    CustomRequest<M extends Method ? M : 'GET', ExtractParams<P>>,
    RequestContext
  >,
) => MaybePromise<
  Response | StaticFile | JsonPayload | null | undefined | void
>;

export type Route<RequestContext> = [
  MethodWithWildcard,
  string,
  Handler<MethodWithWildcard, string, RequestContext>,
];
