class ReadableStream {}

export type BodyInit =
  | Uint8Array // Includes Buffer which is a subclass of Uint8Array
  | string
  | null;

export class Body {
  private _bodyRaw: Buffer | null;
  private _bodyUsed = false;
  readonly body: ReadableStream | null;

  constructor(body: BodyInit) {
    this._bodyRaw = body == null ? null : Buffer.from(body);
    this.body = new ReadableStream();
  }

  get bodyUsed() {
    return this._bodyUsed;
  }

  async text(): Promise<string> {
    this._bodyUsed = true;
    const body = this._bodyRaw;
    return body == null ? '' : body.toString();
  }

  async json<T>(): Promise<T> {
    const text = await this.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return JSON.parse(text) as any;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const text = await this.text();
    return Buffer.from(text);
  }

  // async formData(): Promise<FormData> {
  //   return null as any;
  // }

  // async blob(): Promise<Blob> {
  //   return null as any;
  // }
}
