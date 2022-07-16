type HeadersObject = { [name: string]: string | Array<string> };
export type HeadersInit = HeadersObject | Array<[string, string]> | Headers;

export class Headers {
  private headers = new Map<string, [string, Array<string>]>();

  constructor(init?: HeadersInit) {
    if (init instanceof Headers) {
      for (const [key, [name, values]] of init.headers) {
        this.headers.set(key, [name, values.slice()]);
      }
    } else if (Array.isArray(init)) {
      for (const [name, value] of init) {
        this.append(name, value);
      }
    } else if (init) {
      for (const [name, value] of Object.entries(init)) {
        const key = name.toLowerCase();
        const values = Array.isArray(value) ? value.slice() : [value];
        this.headers.set(key, [name, values]);
      }
    }
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string) {
    const entry = this.headers.get(name.toLowerCase());
    if (entry) {
      return entry[1][0];
    }
  }

  set(name: string, value: string) {
    const key = name.toLowerCase();
    this.headers.set(key, [name, [value]]);
  }

  append(name: string, value: string) {
    const { headers } = this;
    const key = name.toLowerCase();
    const existing = headers.get(key);
    if (existing) {
      existing[1].push(value);
    } else {
      headers.set(key, [name, [value]]);
    }
  }

  forEach(
    fn: (value: string, key: string, container: Headers) => void,
    thisArg?: object,
  ) {
    for (const [_key, [name, values]] of this.headers) {
      const value = values.join(', ');
      thisArg ? fn.call(thisArg, value, name, this) : fn(value, name, this);
    }
  }

  keys() {
    // TODO: Should we preserve case here?
    return this.headers.keys();
  }

  values() {
    return transformIterator(this.headers.values(), ([_name, values]) =>
      values.join(', '),
    );
  }

  entries() {
    return transformIterator(
      this.headers.values(),
      ([name, values]) => [name, values.join(', ')] as const,
    );
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

function transformIterator<T, U>(
  upstreamIterator: IterableIterator<T>,
  transform: (input: T) => U,
): IterableIterator<U> {
  const iterator = {
    [Symbol.iterator]: () => iterator,
    next: () => {
      const result = upstreamIterator.next();
      return result.done
        ? result
        : { done: false, value: transform(result.value) };
    },
  };
  return iterator;
}
