import { describe, expect, it } from 'bun:test';

import { createApplication } from '..';

describe('createApplication', () => {
  it('should be a function', () => {
    expect(typeof createApplication).toBe('function');
  });
});
