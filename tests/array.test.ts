import { map, filter, reduce, head, tail } from '../src/array';

describe('Array utilities', () => {
  describe('map', () => {
    it('should apply a function to each element of an array', () => {
      const double = (x: number) => x * 2;
      const result = map(double)([1, 2, 3]);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle empty arrays', () => {
      const double = (x: number) => x * 2;
      const result = map(double)([]);
      expect(result).toEqual([]);
    });
  });

  describe('filter', () => {
    it('should filter elements based on predicate', () => {
      const isEven = (x: number) => x % 2 === 0;
      const result = filter(isEven)([1, 2, 3, 4, 5]);
      expect(result).toEqual([2, 4]);
    });

    it('should handle empty arrays', () => {
      const isEven = (x: number) => x % 2 === 0;
      const result = filter(isEven)([]);
      expect(result).toEqual([]);
    });
  });

  describe('reduce', () => {
    it('should reduce array to a single value', () => {
      const sum = (acc: number, curr: number) => acc + curr;
      const result = reduce(sum, 0)([1, 2, 3, 4]);
      expect(result).toBe(10);
    });

    it('should return initial value for empty arrays', () => {
      const sum = (acc: number, curr: number) => acc + curr;
      const result = reduce(sum, 5)([]);
      expect(result).toBe(5);
    });
  });

  describe('head', () => {
    it('should return the first element of an array', () => {
      const result = head([1, 2, 3]);
      expect(result).toBe(1);
    });

    it('should return undefined for empty arrays', () => {
      const result = head([]);
      expect(result).toBeUndefined();
    });
  });

  describe('tail', () => {
    it('should return all elements except the first', () => {
      const result = tail([1, 2, 3]);
      expect(result).toEqual([2, 3]);
    });

    it('should return an empty array for single-element arrays', () => {
      const result = tail([1]);
      expect(result).toEqual([]);
    });

    it('should return an empty array for empty arrays', () => {
      const result = tail([]);
      expect(result).toEqual([]);
    });
  });
});
