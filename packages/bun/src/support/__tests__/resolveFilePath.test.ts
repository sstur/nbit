import { describe, expect, it } from 'bun:test';

import { resolveFilePath } from '../resolveFilePath';

describe('resolveFilePath', () => {
  it('should resolve allowed paths relative to root', () => {
    const options = {
      root: '/foo',
      allowStaticFrom: ['public', 'other'],
    };
    expect(
      // should resolve since public is allowed
      resolveFilePath('public/bar.html', options),
    ).toBe('/foo/public/bar.html');
    expect(
      // should not resolve
      resolveFilePath('foo/bar.html', options),
    ).toBe(null);
    expect(resolveFilePath('index.html', options)).toBe(null);
    expect(
      // other is also allowed
      resolveFilePath('other/thing', options),
    ).toBe('/foo/other/thing');
    expect(
      // should not be allowed to traverse outside of root
      resolveFilePath('public/../bar.html', options),
    ).toBe(null);
  });
});
