/* eslint-disable @typescript-eslint/no-explicit-any */
type Reviver = (this: any, key: string, value: any) => any;
type Replacer = (this: any, key: string, value: any) => any;

declare global {
  type ObjectOf<T> = {
    [key: string]: T;
  };

  type JSONValue =
    | null
    | boolean
    | number
    | string
    | Array<JSONValue>
    | { [key: string]: JSONValue };

  type JSONObject = { [key: string]: JSONValue };

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

  // This is used to "expand" an intersection of two or more objects,
  // for example `Expand<{ a: string } & { b: string }>`
  // Reference: https://stackoverflow.com/a/57683652
  type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
}

export {};
