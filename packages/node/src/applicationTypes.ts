/**
 * The exports from this file will be referenced by modules in `core` which is
 * shared (symlinked) across several packages.
 */

import type { IncomingMessage, ServerResponse } from 'http';

export { Request } from './webio/Request';
export { Response, type ResponseInit } from './Response';
export { Headers, type HeadersInit } from './Headers';

export type NativeHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void;
