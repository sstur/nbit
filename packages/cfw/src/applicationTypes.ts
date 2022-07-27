/**
 * The exports from this file will be referenced by modules in `core` which is
 * shared (symlinked) across several packages.
 */

// This one is intentionally the _custom_ Request; it represents what will be
// passed _in_ to each route handler
export { default as Request } from './Request';
// This one is intentionally the _built-in_ Response; it represents what will be
// returned from a route handler. If a custom Response is returned, that is also
// fine because it is a subclass of this built-in Response.
export { default as Response } from './builtins/Response';
export { default as Headers } from './builtins/Headers';
export type { default as ResponseInit } from './builtins/ResponseInit';
export type { default as HeadersInit } from './builtins/HeadersInit';
