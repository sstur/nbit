import { type StaticFileOptions } from './core/StaticFile';

export default class CustomResponse extends Response {
  static file(_filePath: string, _init?: ResponseInit & StaticFileOptions) {
    throw new Error('Response.file() not implemented.');
  }
}
