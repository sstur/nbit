/**
 * The exports from this file will be referenced by modules in `core` which is
 * shared (symlinked) across several packages.
 */

export { CustomRequest as Request } from './Request';
export { Response, type ResponseInit } from './Response';
export { Headers, type HeadersInit } from './Headers';
