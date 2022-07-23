import { StaticFile, type StaticFileOptions } from './core/StaticFile';
import { resolveFilePath } from './support/resolveFilePath';
import { serveFile } from './support/serveFile';
import type { FileServingOptions } from './types';

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

  async toNativeResponse(applicationOptions: FileServingOptions) {
    const body = this._body;
    const init = this._init;
    if (body instanceof StaticFile) {
      const { filePath, options } = body;
      const fullFilePath = resolveFilePath(filePath, applicationOptions);
      if (fullFilePath != null) {
        const fileResponse = await serveFile(
          this.headers,
          fullFilePath,
          options,
        );
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
          return new Response(fileResponse.body ?? [], {
            status,
            statusText: init?.statusText ?? '',
            headers,
          });
        }
      }
      return new Response('', { status: 404 });
    } else {
      return new Response(body, init);
    }
  }

  static file(filePath: string, init?: ResponseInit & StaticFileOptions) {
    const { status, statusText, headers, ...options } = init ?? {};
    return new CustomResponse(new StaticFile(filePath, options), {
      status: status ?? 200,
      statusText: statusText ?? '',
      headers: headers ?? [],
    });
  }
}
