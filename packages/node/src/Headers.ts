export type HeadersInit =
  | Array<[string, string]>
  | Record<string, string>
  | Headers;

export class Headers {
  // TODO: Consider internally storing as a Node-style object, so we can easily
  // return it without iterating so often. We might also want to store along
  // side it a lower-case -> mixed-case mapping.
  // Consider tracking copy-on-write or some other way to do less copying.
  private headers = new Map<string, [string, Array<string>]>();

  constructor(init?: HeadersInit) {
    // TODO: Should be able to iterate this without using private `.headers`
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
        this.headers.set(key, [name, [value]]);
      }
    }
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string) {
    const entry = this.headers.get(name.toLowerCase());
    if (entry) {
      // TODO: This is wrong / not spec compliant. Should .join()
      return entry[1][0] ?? null;
    }
    return null;
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

  // Non-standard method to make it easy to convert headers to the  object
  // expected by Node's response.writeHead().
  // https://nodejs.org/docs/latest-v16.x/api/http.html#responsewriteheadstatuscode-statusmessage-headers
  toNodeHeaders() {
    const result: Record<string, string | Array<string>> = {};
    for (const [name, values] of this.headers.values()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result[name] = values.length === 1 ? values[0]! : values;
    }
    return result;
  }

  // https://nodejs.org/docs/latest-v16.x/api/http.html#messagerawheaders
  static fromNodeRawHeaders(rawHeaders: Array<string>) {
    const headers = new Headers();
    for (let i = 0; i < rawHeaders.length; i++) {
      const name = rawHeaders[i] ?? '';
      const value = rawHeaders[++i] ?? '';
      headers.append(name, value);
    }
    return headers;
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
