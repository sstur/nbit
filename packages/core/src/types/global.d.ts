/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSONValue } from './json';

type Reviver = (this: any, key: string, value: any) => any;
type Replacer = (this: any, key: string, value: any) => any;

declare global {
  interface JSON {
    parse(text: string, reviver?: Reviver): JSONValue;
    stringify<T>(
      value: T,
      replacer?: Replacer | Array<number | string> | null,
      space?: string | number,
    ): undefined extends T
      ? T extends undefined
        ? undefined
        : string | undefined
      : string;
  }

  interface ObjectConstructor {
    keys<T>(
      o: T,
    ): T extends Record<string, unknown>
      ? Array<keyof T & string>
      : Array<string>;
  }
}

export {};
