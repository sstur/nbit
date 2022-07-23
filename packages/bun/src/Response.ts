import { resolveFilePath } from './support/resolveFilePath';
import { serveFile } from './support/serveFile';
import type { FileServingOptions } from './types';

export class StaticFile {
  constructor(readonly filePath: string) {}
}

export default class CustomResponse extends Response {
  private _body: StaticFile | BlobPart | Array<BlobPart>;
  private _init: ResponseInit | undefined;

  constructor(
    body: StaticFile | BlobPart | Array<BlobPart>,
    init?: ResponseInit,
  ) {
    if (body instanceof StaticFile) {
      super('', init);
    } else {
      super(body, init);
    }
    this._body = body;
    this._init = init;
  }

  async toNativeResponse(options: FileServingOptions) {
    const body = this._body;
    const init = this._init;
    if (body instanceof StaticFile) {
      const { filePath } = body;
      const fullFilePath = resolveFilePath(filePath, options);
      if (fullFilePath != null) {
        const fileResponse = await serveFile(this.headers, fullFilePath);
        if (fileResponse != null) {
          // The status might be something like 304 Not Modified
          const status = fileResponse.status ?? init?.status ?? 200;
          const headers = new Headers(fileResponse.headers);
          if (init?.headers) {
            // Is there an easier way to merge the old headers in here?
            for (const [name, value] of new Headers(init.headers).entries()) {
              headers.set(name, value);
            }
          }
          return new Response(fileResponse.readStream, {
            ...init,
            status,
            headers,
          });
        }
      }
      return new Response('', { status: 404 });
    } else {
      return new Response(body, init);
    }
  }

  static sendFile(filePath: string, init?: ResponseInit) {
    return new CustomResponse(new StaticFile(filePath), init);
  }
}
