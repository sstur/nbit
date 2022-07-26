/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'path' {
  export const extname: (...args: Array<any>) => string;
  export const join: (...args: Array<string>) => string;
  export const resolve: (...args: Array<string>) => string;
}
