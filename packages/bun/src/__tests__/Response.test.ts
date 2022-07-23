import { describe, expect, it } from 'bun:test';

import { Response } from '../Response';
import { Response as NativeResponse } from '../builtins';

describe('Response', () => {
  it('should be a subclass of the native Response', async () => {
    const response = new Response('foo', { status: 418 });
    expect(response instanceof NativeResponse).toBe(true);
    expect(response.status).toBe(418);
    expect(response.statusText).toBe('');
    expect(response.headers instanceof Headers).toBe(true);
    expect(response.bodyUsed).toBe(false);
    const nativeResponse = await response.toNativeResponse({});
    expect(nativeResponse !== response).toBe(true);
    expect(nativeResponse instanceof NativeResponse).toBe(true);
    expect(nativeResponse instanceof Response).toBe(false);
  });

  it('should have the static methods from native Response', () => {
    const response = Response.json({ foo: 1 });
    expect(response instanceof NativeResponse).toBe(true);
    expect(response instanceof Response).toBe(false);
    expect(response.status).toBe(200);
    const headers = Object.fromEntries(response.headers.entries());
    expect(JSON.stringify(headers)).toBe(
      JSON.stringify({ 'content-type': 'application/json;charset=utf-8' }),
    );
  });
});
