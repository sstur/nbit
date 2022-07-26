/* eslint-disable no-var */
declare global {
  // NOTE: These need to be `var` and not `const` for weird TS reasons.
  var process: { cwd: () => string };
}

export {};
