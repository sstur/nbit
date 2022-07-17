/**
 * This is intentionally just a stub; this will never be instantiated because
 * the files which reference this will only be called from the locations that
 * symlink to `core` meaning, when they import `../Response` they will be
 * getting the real Response (from the parent of they symlink) not this stub.
 */
export class Response {
  readonly status: number = 200;
}
