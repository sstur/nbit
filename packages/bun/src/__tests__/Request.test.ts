import { describe, expect, it } from 'bun:test';

import { Request } from '../Request';
import { Request as NativeRequest } from '../builtins';

describe('Request', () => {
  it('should work', () => {
    const nativeRequest = new NativeRequest('http://localhost/foo/1', {
      method: 'GET',
    });
    const request = new Request(nativeRequest, { id: '1' });
    expect(request.method).toBe('GET');
    expect(request.path).toBe('/foo/1');
    expect(request.query instanceof URLSearchParams).toBe(true);
    expect(request.query.toString()).toBe('');
    expect(request.headers instanceof Headers).toBe(true);
    expect(request.headers === nativeRequest.headers).toBe(true);
    expect(JSON.stringify(request.params)).toBe('{"id":"1"}');
  });
});
