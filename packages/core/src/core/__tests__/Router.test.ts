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
    router.insert('GET', '/users/:id', { name: 'user_get' });
    router.insert('POST', '/users/:id', { name: 'user_post' });
    router.insert('POST', '/users/:userId/pets/:petId', { name: 'pet' });
    router.insert('*', '/login', { name: 'login' });
  });

  it('should not match incorrect method', () => {
    expect(router.getMatches('POST', '/')).toEqual([]);
    expect(router.getMatches('PUT', '/users/foo')).toEqual([]);
  });

  it('should not match incorrect path', () => {
    expect(router.getMatches('GET', '/foo')).toEqual([]);
    expect(router.getMatches('GET', '/users')).toEqual([]);
    expect(router.getMatches('GET', '/users/')).toEqual([]);
  });

  it('should match correct method and path', () => {
    expect(router.getMatches('GET', '/')).toEqual([
      // Each match is a tuple with payload and a captures object
      [{ name: 'home' }, {}],
    ]);
    expect(router.getMatches('GET', '/about')).toEqual([
      [{ name: 'about' }, {}],
    ]);
    expect(router.getMatches('GET', '/users/a')).toEqual([
      [{ name: 'user_get' }, { id: 'a' }],
    ]);
    expect(router.getMatches('POST', '/users/123')).toEqual([
      [{ name: 'user_post' }, { id: '123' }],
    ]);
    expect(router.getMatches('GET', '/login')).toEqual([
      [{ name: 'login' }, {}],
    ]);
    expect(router.getMatches('POST', '/login')).toEqual([
      [{ name: 'login' }, {}],
    ]);
  });

  it('should capture multiple params', () => {
    expect(router.getMatches('POST', '/users/23/pets/4')).toEqual([
      [{ name: 'pet' }, { userId: '23', petId: '4' }],
    ]);
  });
});
