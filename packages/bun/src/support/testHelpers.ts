/* eslint-disable @typescript-eslint/no-explicit-any */
const isTest = process.env.BUN_ENV === 'test';

type ResetMock = () => void;

let weakMap = new WeakMap<object, Record<string | symbol, any>>();

export function mockable<T extends object>(obj: T): T {
  return isTest ? proxy(obj) : obj;
}

function proxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, key, proxied) {
      const mocks = weakMap.get(proxied);
      return mocks && Object.hasOwn(mocks, key)
        ? mocks[key]
        : obj[key as never];
    },
  });
}

export function mockMethod<O extends object, K extends keyof O>(
  obj: O,
  key: K,
  mock: O[K],
): ResetMock {
  const mocks = weakMap.get(obj) || {};
  weakMap.set(obj, mocks);
  mocks[key as string] = mock;
  return () => {
    const mocks = weakMap.get(obj);
    if (mocks) {
      delete mocks[key as string];
    }
  };
}

export function resetAllMocks() {
  weakMap = new WeakMap();
}
