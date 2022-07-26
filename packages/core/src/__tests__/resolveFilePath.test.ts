import { resolveFilePath } from '../fs';

describe('resolveFilePath', () => {
  it('should resolve allowed paths relative to root', () => {
    const options = {
      root: '/foo',
      allowStaticFrom: ['public', 'other'],
    };
    expect(
      // should resolve since public is allowed
      resolveFilePath('public/bar.html', options),
    ).toEqual(['/foo/public/bar.html', 'public']);
    expect(
      // should not resolve
      resolveFilePath('foo/bar.html', options),
    ).toEqual(null);
    expect(resolveFilePath('index.html', options)).toBe(null);
    expect(
      // other is also allowed
      resolveFilePath('other/thing', options),
    ).toEqual(['/foo/other/thing', 'other']);
    expect(
      // should not be allowed to traverse outside of root
      resolveFilePath('public/../bar.html', options),
    ).toEqual(null);
  });
});
