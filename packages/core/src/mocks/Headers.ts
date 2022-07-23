export type HeadersInit =
  | Array<[string, string]>
  | Record<string, string>
  | Headers;

export class Headers {
  private headers = new Map<string, string>();

  constructor(_init?: HeadersInit) {}

  has(_name: string) {
    return false;
  }

  get(_name: string): string | undefined {
    return undefined;
  }

  set(_name: string, _value: string) {}

  append(_name: string, _value: string) {}

  keys() {
    return this.headers.keys();
  }

  values() {
    return this.headers.values();
  }

  entries() {
    return this.headers.entries();
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
