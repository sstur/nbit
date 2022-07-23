import { describe, expect, it } from 'bun:test';

import CustomResponse from '../Response';

describe('Response', () => {
  it('should be a subclass of the native Response', async () => {
    const response = new CustomResponse('foo', { status: 418 });
    expect(response instanceof Response).toBe(true);
    expect(response.status).toBe(418);
    expect(response.statusText).toBe('');
    expect(response.headers instanceof Headers).toBe(true);
    expect(response.bodyUsed).toBe(false);
    const nativeResponse = await response.toNativeResponse({});
    expect(nativeResponse !== response).toBe(true);
    expect(nativeResponse instanceof Response).toBe(true);
    expect(nativeResponse instanceof CustomResponse).toBe(false);
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
});
