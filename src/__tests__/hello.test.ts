import { hello } from '../hello';

describe('hello', () => {
  it('should return a string', () => {
    expect(hello('world')).toBe('Hello world!');
  });
});
