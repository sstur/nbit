/**
 * This provides a way to create a set of pre-defined custom errors. The reason
 * we'd do this is so that our application code can easily determine if a given
 * error is of some known kind by checking the `name` property or by using
 * `instanceof`.
 */

import type { Expand } from '../../types';

type StringWithPlaceholder = `${string}{${string}}${string}`;

type Parse<T extends StringWithPlaceholder> =
  T extends `${infer _Start}{${infer Var}}${infer Rest}`
    ? Rest extends StringWithPlaceholder
      ? Expand<{ [K in Var]: unknown } & Parse<Rest>>
      : { [K in Var]: unknown }
    : never;

export function defineErrors<S extends string, T extends Record<string, S>>(
  input: T,
): {
  [K in keyof T as K extends `${string}Error`
    ? K
    : never]: T[K] extends StringWithPlaceholder
    ? new (params: Parse<T[K]>) => Error
    : new () => Error;
} {
  return Object.fromEntries(
    Object.entries(input).map(([name, message]) => [
      name,
      Object.defineProperties(
        class extends Error {
          constructor(
            params?: Record<string, unknown>,
            options?: ErrorOptions,
          ) {
            super(params ? resolveMessage(message, params) : message, options);
          }
          get name() {
            return name;
          }
          get [Symbol.toStringTag]() {
            return name;
          }
        },
        {
          // Defining the name property here is only necessary because we're
          // using an anonymous class
          name: { value: name, configurable: true },
        },
      ),
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
}

function resolveMessage(message: string, params: Record<string, unknown>) {
  return message.replace(/\{(.*?)\}/g, (_, key) => {
    return params[key] == null ? '' : String(params[key]);
  });
}
