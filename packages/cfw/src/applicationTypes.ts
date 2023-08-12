/**
 * The exports from this file will be referenced by modules in `core` which is
 * shared (symlinked) across several packages.
 */

export const PLATFORM = 'cfw';
export {
  Request,
  type RequestInit,
  Response,
  type ResponseInit,
  Headers,
  type HeadersInit,
} from './web-io';
