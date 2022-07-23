import { describe, expect, it } from 'bun:test';

import CustomRequest from '../Request';

describe('Request', () => {
  it('should work', () => {
    const nativeRequest = new Request('http://localhost/foo/1', {
      method: 'GET',
    });
    const request = new CustomRequest(nativeRequest, { id: '1' });
    expect(request.method).toBe('GET');
    expect(request.path).toBe('/foo/1');
    expect(request.query instanceof URLSearchParams).toBe(true);
    expect(request.query.toString()).toBe('');
    expect(request.headers instanceof Headers).toBe(true);
    expect(request.headers === nativeRequest.headers).toBe(true);
    expect(JSON.stringify(request.params)).toBe('{"id":"1"}');
  });
});
