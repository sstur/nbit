import { getMimeTypeFromExt, getExtForMimeType } from '../mimeTypes';

describe('mimeTypes', () => {
  it('should look up mime type from file extension', () => {
    expect(getMimeTypeFromExt('htm')).toEqual('text/html');
    expect(getMimeTypeFromExt('html')).toEqual('text/html');
    expect(getMimeTypeFromExt('png')).toEqual('image/png');
    expect(getMimeTypeFromExt('asdf')).toEqual(undefined);
  });

  it('should look up extension from mime type', () => {
    expect(getExtForMimeType('text/html')).toEqual('html');
    expect(getExtForMimeType('application/json')).toEqual('json');
    expect(getExtForMimeType('application/asdf')).toEqual(undefined);
  });
});
