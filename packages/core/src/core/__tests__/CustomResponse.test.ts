import { Response, Headers } from '../../web-io';
import CustomResponse from '../CustomResponse';
import { StaticFile } from '../StaticFile';

describe('CustomResponse', () => {
  it('should be a subclass of the native Response', async () => {
    const response = new CustomResponse('foo', { status: 418 });
    expect(response instanceof Response).toBe(true);
    expect(response.status).toBe(418);
    // Temporarily disabled because statusText this is broken in Bun
    // https://github.com/oven-sh/bun/issues/866
    // expect(response.statusText).toBe("I'm a Teapot");
    expect(response.headers instanceof Headers).toBe(true);
    expect(response.bodyUsed).toBe(false);
  });

  it('should have the static methods from native Response', () => {
    const response = CustomResponse.json({ foo: 1 });
    expect(response instanceof Response).toBe(true);
    expect(response instanceof CustomResponse).toBe(false);
    expect(response.status).toBe(200);
    const contentType = response.headers.get('Content-Type') ?? '';
    // In some implementations there will be `;charset=utf-8`
    expect(contentType.split(';')[0]).toBe('application/json');
  });

  it('should have custom static method Response.file()', () => {
    const response = CustomResponse.file('path/to/foo.txt', {
      headers: { 'X-Custom-Thing': 'foo' },
      maxAge: 700,
    });
    expect(response instanceof StaticFile).toBe(true);
    expect(response.filePath).toBe('path/to/foo.txt');
    expect(JSON.stringify(response.options)).toBe(
      JSON.stringify({ maxAge: 700 }),
    );
    expect(JSON.stringify(response.responseInit)).toBe(
      JSON.stringify({
        status: 200,
        statusText: '',
        headers: { 'X-Custom-Thing': 'foo' },
      }),
    );
  });
});
