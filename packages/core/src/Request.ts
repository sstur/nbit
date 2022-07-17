/**
 * This is intentionally just a stub; this will never be instantiated because
 * the files which reference this will only be called from the locations that
 * symlink to `core` meaning, when they import `../Request` they will be
 * getting the real Request (from the parent of they symlink) not this stub.
 */
export class Request<M extends string, Params extends string> {
  readonly method = '' as M;
  readonly params = {} as { [K in Params]: string };
}
