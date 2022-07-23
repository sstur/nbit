/**
 * The types exported from this file will be referenced by modules in `core`
 * which is shared (symlinked) across several packages.
 */

// This one is intentionally the _custom_ Request; it specifies what will be
// passed _in_ to each route handler
export type { default as Request } from './Request';
// This one is intentionally the _built-in_ Response; it specifies what will be
// returned from a route handler. If a custom Response is returned, that is
// also fine because it is a subclass of this built-in Response.
export type { default as Response } from './builtins/Response';
export type { default as ResponseInit } from './builtins/ResponseInit';
export type { default as Headers } from './builtins/Headers';
export type { default as HeadersInit } from './builtins/HeadersInit';
