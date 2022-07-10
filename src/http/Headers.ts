export type HeadersObject = Record<string, string | Array<string> | undefined>;

export class Headers {
  private headers: HeadersObject;

  constructor(headers: HeadersObject) {
    this.headers = headers;
  }

  get(name: string) {
    const value = this.headers[name.toLowerCase()];
    return Array.isArray(value) ? value.join(', ') : value;
  }
}
