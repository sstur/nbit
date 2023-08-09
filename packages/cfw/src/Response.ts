import { type StaticFileInit } from './core/StaticFile';

export default class CustomResponse extends Response {
  static file(_filePath: string, _init?: StaticFileInit) {
    throw new Error('Response.file() not implemented.');
  }
}
