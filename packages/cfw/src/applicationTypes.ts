/**
 * The exports from this file will be referenced by modules in `core` which is
 * shared (symlinked) across several packages.
 */

export const PLATFORM = 'cfw';
export { default as Request } from './builtins/Request';
export { default as Response } from './builtins/Response';
export { default as Headers } from './builtins/Headers';
export type { default as ResponseInit } from './builtins/ResponseInit';
export type { default as HeadersInit } from './builtins/HeadersInit';
