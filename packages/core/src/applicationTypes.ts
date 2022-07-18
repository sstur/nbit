/**
 * This file contains type stubs that are not actually used in any code that
 * ships; the files that reference these types are symlinked to from other
 * packages in such a way that when they import Request or Response they will
 * get the real ones, not these stubs.
 */

class Request<M extends string, Params extends string> {
  readonly method = '' as M;
  readonly params = {} as { [K in Params]: string };
}

class Response {
  readonly status: number = 200;
}

export type { Request, Response };
