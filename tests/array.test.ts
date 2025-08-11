import { map, filter, reduce, head, tail, get, isEmpty, length } from '../src/array';
import { success, failure } from '../src/result';

describe('Array utilities - Result-based API', () => {
  describe('map', () => {
    it('should apply a function to each element of an array', () => {
      const safeParse = (x: string) => {
        const num = parseInt(x);
        return isNaN(num) ? failure('Not a number') : success(num);
      };

      const result = map(safeParse)(['1', '2', '3']);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([1, 2, 3]);
    });

    it('should return failure on first error', () => {
      const safeParse = (x: string) => {
        const num = parseInt(x);
        return isNaN(num) ? failure('Not a number') : success(num);
      };

      const result = map(safeParse)(['1', 'invalid', '3']);
      expect(result.isFailure()).toBe(true);
    });

    it('should handle empty arrays', () => {
      const double = (x: number) => success(x * 2);
      const result = map(double)([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([]);
    });
  });

  describe('filter', () => {
    it('should filter elements based on predicate', () => {
      const safeIsEven = (x: number) => success(x % 2 === 0);
      const result = filter(safeIsEven)([1, 2, 3, 4, 5]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([2, 4]);
    });

    it('should return failure when predicate fails', () => {
      const riskyPredicate = (x: number) =>
        x === 3 ? failure('Cannot process 3') : success(x > 2);

      const result = filter(riskyPredicate)([1, 2, 3, 4]);
      expect(result.isFailure()).toBe(true);
    });

    it('should handle empty arrays', () => {
      const safeIsEven = (x: number) => success(x % 2 === 0);
      const result = filter(safeIsEven)([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([]);
    });
  });

  describe('reduce', () => {
    it('should reduce array to a single value', () => {
      const safeSum = (acc: number, curr: number) => success(acc + curr);
      const result = reduce(safeSum, 0)([1, 2, 3, 4]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(10);
    });

    it('should return initial value for empty arrays', () => {
      const safeSum = (acc: number, curr: number) => success(acc + curr);
      const result = reduce(safeSum, 5)([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(5);
    });

    it('should return failure when reducer fails', () => {
      const riskySum = (acc: number, curr: number) =>
        curr === 3 ? failure('Cannot add 3') : success(acc + curr);

      const result = reduce(riskySum, 0)([1, 2, 3, 4]);
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('head', () => {
    it('should return the first element of an array', () => {
      const result = head([1, 2, 3], () => 'Empty array');
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(1);
    });

    it('should return failure for empty arrays', () => {
      const result = head([], () => 'Empty array');
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('tail', () => {
    it('should return all elements except the first', () => {
      const result = tail([1, 2, 3]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([2, 3]);
    });

    it('should return empty array when given single element', () => {
      const result = tail([1]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([]);
    });

    it('should return empty array when given empty array', () => {
      const result = tail([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse([])).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return element at valid index', () => {
      const result = get(1, i => `Index ${i} out of bounds`)([10, 20, 30]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(20);
    });

    it('should return failure for invalid index', () => {
      const result = get(5, i => `Index ${i} out of bounds`)([10, 20, 30]);
      expect(result.isFailure()).toBe(true);
    });

    it('should return failure for negative index', () => {
      const result = get(-1, i => `Index ${i} out of bounds`)([10, 20, 30]);
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty array', () => {
      const result = isEmpty([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(false)).toBe(true);
    });

    it('should return false for non-empty array', () => {
      const result = isEmpty([1, 2, 3]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(true)).toBe(false);
    });
  });

  describe('length', () => {
    it('should return array length', () => {
      const result = length([1, 2, 3, 4]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(4);
    });

    it('should return 0 for empty array', () => {
      const result = length([]);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(-1)).toBe(0);
    });
  });
});
