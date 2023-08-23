// For situations where we can't set properties on an object, e.g. the global
// `Bun`, we'll use this helper to create a Proxy
export function mockable<T extends object>(obj: T): T {
  const mocks: Record<string | symbol, unknown> = {};
  const target = obj as Record<string | symbol, unknown>;
  const receiver = new Proxy(target, {
    get(target, key) {
      return Object.hasOwn(mocks, key) ? mocks[key] : target[key];
    },
    set(target, key, value) {
      if (value === target[key]) {
        delete mocks[key];
      } else {
        mocks[key] = value;
      }
      return true;
    },
  });
  return receiver as T;
}

export function mockMethod<O extends object, K extends keyof O>(
  obj: O,
  key: K,
  mock: O[K],
) {
  const original = obj[key];
  obj[key] = mock;
  return () => {
    obj[key] = original;
  };
}
