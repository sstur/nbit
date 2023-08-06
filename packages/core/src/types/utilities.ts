// A helpful utility type to expand an intersection of two or more object.
// Source: https://stackoverflow.com/a/57683652
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * A way to specify a union of string literals (for autocomplete) but also allow
 * any string.
 * See: https://github.com/Microsoft/TypeScript/issues/29729
 * Similar to this implementation:
 * https://github.com/sindresorhus/type-fest/blob/e3234d7/source/literal-union.d.ts
 */
export type LooseUnion<T extends string> =
  | T
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});
