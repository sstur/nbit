import { Response as NativeResponse } from './builtins';
import { resolveFilePath } from './support/resolveFilePath';
import type { FileServingOptions } from './types';

export class StaticFile {
  constructor(readonly filePath: string) {}
}

export class Response extends NativeResponse {
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
      if (fullFilePath == null) {
        // TODO: Better error
        return new NativeResponse('Unable to serve file', { status: 403 });
      }
      // TODO: Deal with caching headers
      // TODO: Ensure file exists
      return new NativeResponse(Bun.file(fullFilePath), init);
    } else {
      return new NativeResponse(body, init);
    }
  }

  static sendFile(filePath: string, init?: ResponseInit) {
    return new Response(new StaticFile(filePath), init);
  }
}
