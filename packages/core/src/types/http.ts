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
   * The root from which file paths will be resolved when serving files.
   * Defaults to current working directory (or `/` in serverless environments).
   */
  root?: string;
  /**
   * An array of paths (relative to `root`) from which static files are allowed
   * to be served when invoking `Response.file(filePath)`. If `allowStaticFrom`
   * is not specified, or if the fully-resolved filePath does not exist within
   * an allowed path, all files will be treated as non-existent, resulting in
   * 404.
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
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Methods that are not allowed to have a request body
export type MethodNoBody = Exclude<Method, 'POST' | 'PUT'>;

export type Handler<M extends string, P extends string, RequestContext> = (
  request: MaybeIntersect<CustomRequest<M, ExtractParams<P>>, RequestContext>,
) => MaybePromise<
  Response | StaticFile | JsonPayload | null | undefined | void
>;

export type Route<RequestContext> = [
  string,
  string,
  Handler<string, string, RequestContext>,
];
