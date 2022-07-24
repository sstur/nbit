import { StaticFile, type StaticFileOptions } from './core/StaticFile';

export default class CustomResponse extends Response {
  static file(filePath: string, init?: ResponseInit & StaticFileOptions) {
    return new StaticFile(filePath, init);
  }
}
