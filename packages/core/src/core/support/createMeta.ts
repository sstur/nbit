export function createMeta<T>() {
  const weakMap = new WeakMap<object, T>();
  const get = (object: object): T | undefined => {
    return weakMap.get(object);
  };
  const set = <O extends object>(object: O, value: T): O => {
    weakMap.set(object, value);
    return object;
  };
  return [get, set] as const;
}
