import { map, filter, head } from '../src/array';
import { success, failure } from '../src/result';

describe('Array Result utilities', () => {
  describe('map', () => {
    it('should map elements with a function returning Result', () => {
      const double = (x: number) => success(x * 2);
      const result = map(double)([1, 2, 3]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([2, 4, 6]);
    });

    it('should return first failure', () => {
      const maybeDouble = (x: number) => (x === 2 ? failure(`Cannot double ${x}`) : success(x * 2));

      const result = map(maybeDouble)([1, 2, 3]);
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Cannot double 2');
    });
  });

  describe('filter', () => {
    it('should filter based on predicate returning Result', () => {
      const isEven = (x: number) => success(x % 2 === 0);
      const result = filter(isEven)([1, 2, 3, 4]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([2, 4]);
    });

    it('should return first failure', () => {
      const isEven = (x: number) =>
        x === 3 ? failure(`Cannot check if ${x} is even`) : success(x % 2 === 0);

      const result = filter(isEven)([1, 2, 3, 4]);
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Cannot check if 3 is even');
    });
  });

  describe('head', () => {
    it('should return Success with first element', () => {
      const result = head([1, 2, 3], () => 'Empty array');
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(1);
    });

    it('should return Failure for empty array', () => {
      const result = head([], () => 'Empty array');
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Empty array');
    });
  });
});
