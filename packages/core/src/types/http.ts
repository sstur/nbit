import type { Headers, Response } from '../web-io';
import type { StaticFile, StaticFileOptions } from '../core/StaticFile';
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
  /**
   * Overrides the default serveFile. Useful within tests or serverless
   * environments.
   *
   * This is invoked when a request handler returns `Response.file(filePath)`.
   *
   * If the `root` option is specified, `filePath` will be resolved relative to
   * that, otherwise it will be resolved relative to process.cwd (or `/` in
   * serverless environments). The fully resolved path will be checked against
   * `allowStaticFrom` and if that check does not pass (or allowStaticFrom is
   * not specified) then `serveFile` will never be invoked and a 404 response
   * will be sent.
   *
   * Return null to indicate no valid file exists at the given path, resulting
   * in 404 response.
   *
   * Note: A comprehensive implementation of serveFile should specify response
   * headers such as Content-Type, Last-Modified, ETag and Cache-Control (see
   * packages/core/src/fs/fileServing.ts). It should also potentially send a
   * response status of 304 based on request headers like `If-Modified-Since`
   * and/or `If-None-Match` (see packages/core/src/fs/caching.ts).
   */
  serveFile?: (params: {
    /** The original path specified in Response.file(...) */
    filePath: string;
    /** The fully resolved path starting with `/` */
    fullFilePath: string;
    /** Specified at call site, e.g. Response.file(filePath, { status }) */
    status: number;
    /** Specified at call site, e.g. Response.file(filePath, { statusText }) */
    statusText: string;
    /** Specified at call site, e.g. Response.file(filePath, { headers }) */
    headers: Headers;
    /** File serving options such as `maxAge`, specified at call site, e.g. Response.file(filePath, { maxAge }) */
    options: StaticFileOptions;
  }) => Promise<Response | null>;
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
