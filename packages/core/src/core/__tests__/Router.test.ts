import { createRouter } from '../Router';

describe('Basic routing', () => {
  // Payload can be any type really. It's typically a route handler, but we'll
  // use something simple for testing.
  type Payload = { name: string };
  let router = createRouter<Payload>();

  beforeEach(() => {
    router = createRouter<Payload>();
    router.insert('GET', '/', { name: 'home' });
    router.insert('GET', '/about', { name: 'about' });
    router.insert('GET', '/about', { name: 'about2' });
    router.insert('GET', '/users/me', { name: 'user_me' });
    router.insert('GET', '/users/:id', { name: 'user_get' });
    router.insert('POST', '/users/:id', { name: 'user_post' });
    router.insert('POST', '/users/:userId/pets/:petId', { name: 'pet' });
    router.insert('*', '/login', { name: 'login' });
    router.insert('PUT', '/files/*', { name: 'files' });
  });

  it('should not match incorrect method', () => {
    expect(router.getMatches('POST', '/')).toEqual([]);
    expect(router.getMatches('PUT', '/users/foo')).toEqual([]);
    expect(router.getMatches('POST', '/files/x')).toEqual([]);
  });

  it('should not match incorrect path', () => {
    expect(router.getMatches('GET', '/foo')).toEqual([]);
    expect(router.getMatches('GET', '/users')).toEqual([]);
    expect(router.getMatches('GET', '/users/')).toEqual([]);
  });

  it('should match correct method and path', () => {
    expect(router.getMatches('GET', '/')).toEqual([
      // Each match is a tuple with payload and a captures object
      [{ name: 'home' }, {}, ['GET', '/']],
    ]);
    expect(router.getMatches('POST', '/users/123')).toEqual([
      [{ name: 'user_post' }, { id: '123' }, ['POST', '/users/:id']],
    ]);
    expect(router.getMatches('GET', '/login')).toEqual([
      [{ name: 'login' }, {}, ['*', '/login']],
    ]);
    expect(router.getMatches('POST', '/login')).toEqual([
      [{ name: 'login' }, {}, ['*', '/login']],
    ]);
  });

  it('should return multiple matches if applicable', () => {
    expect(router.getMatches('GET', '/about')).toEqual([
      [{ name: 'about' }, {}, ['GET', '/about']],
      [{ name: 'about2' }, {}, ['GET', '/about']],
    ]);
    expect(router.getMatches('GET', '/users/me')).toEqual([
      [{ name: 'user_me' }, {}, ['GET', '/users/me']],
      [{ name: 'user_get' }, { id: 'me' }, ['GET', '/users/:id']],
    ]);
  });

  it('should capture multiple params', () => {
    expect(router.getMatches('POST', '/users/23/pets/4')).toEqual([
      [
        { name: 'pet' },
        { userId: '23', petId: '4' },
        ['POST', '/users/:userId/pets/:petId'],
      ],
    ]);
  });

  it('should correctly handle wildcard paths', () => {
    expect(router.getMatches('PUT', '/files')).toEqual([]);
    expect(router.getMatches('PUT', '/files/')).toEqual([
      [{ name: 'files' }, { '*': '' }, ['PUT', '/files/*']],
    ]);
    expect(router.getMatches('PUT', '/files/foo')).toEqual([
      [{ name: 'files' }, { '*': 'foo' }, ['PUT', '/files/*']],
    ]);
    expect(router.getMatches('PUT', '/files/foo/bar.txt')).toEqual([
      [{ name: 'files' }, { '*': 'foo/bar.txt' }, ['PUT', '/files/*']],
    ]);
  });
});
