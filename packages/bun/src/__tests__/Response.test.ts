import CustomResponse from '../Response';
import { StaticFile } from '../core/StaticFile';

describe('Response', () => {
  it('should be a subclass of the native Response', async () => {
    const response = new CustomResponse('foo', { status: 418 });
    expect(response instanceof Response).toBe(true);
    expect(response.status).toBe(418);
    expect(response.statusText).toBe('');
    expect(response.headers instanceof Headers).toBe(true);
    expect(response.bodyUsed).toBe(false);
  });

  it('should have the static methods from native Response', () => {
    const response = CustomResponse.json({ foo: 1 });
    expect(response instanceof Response).toBe(true);
    expect(response instanceof CustomResponse).toBe(false);
    expect(response.status).toBe(200);
    const headers = Object.fromEntries(response.headers.entries());
    expect(JSON.stringify(headers)).toBe(
      JSON.stringify({ 'content-type': 'application/json;charset=utf-8' }),
    );
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
