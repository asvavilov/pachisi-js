import { describe, it, expect } from 'vitest';
import { firstElement, lastElement } from 'src/utils/array';

describe('array utils', () => {
  it('firstElement([1,2,3]) === 1', () => {
    expect(firstElement([1, 2, 3])).toBe(1);
  });

  it('firstElement([]) === undefined', () => {
    expect(firstElement([])).toBeUndefined();
  });

  it('lastElement([1,2,3]) === 3', () => {
    expect(lastElement([1, 2, 3])).toBe(3);
  });

  it('lastElement([]) === undefined', () => {
    expect(lastElement([])).toBeUndefined();
  });
});
