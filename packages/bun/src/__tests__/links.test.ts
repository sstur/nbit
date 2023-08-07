import { getPlatform } from '../core/support/getPlatform';

it('should correctly import across symlinked boundaries', () => {
  const platform = getPlatform();
  expect(platform).toBe('bun');
});
