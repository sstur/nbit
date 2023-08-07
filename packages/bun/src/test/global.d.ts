/* eslint-disable no-var */
import type * as bun from 'bun:test';

declare global {
  // NOTE: Need to use `var` and not `const` here for weird TS reasons.
  // Source https://stackoverflow.com/a/69429093
  var describe: typeof bun.describe;
  var expect: typeof bun.expect;
  var it: typeof bun.it;
  var beforeAll: typeof bun.beforeAll;
  var beforeEach: typeof bun.beforeEach;
  var afterAll: typeof bun.afterAll;
  var afterEach: typeof bun.afterEach;
}

export {};
