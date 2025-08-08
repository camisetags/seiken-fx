import { curry } from '../src/compose';

describe('Composition utilities', () => {
  describe('curry', () => {
    it('should curry a function with multiple arguments', () => {
      const add = (a: number, b: number, c: number) => a + b + c;
      const curriedAdd = curry(add);

      expect(curriedAdd(1, 2, 3)).toBe(6);
      expect(curriedAdd(1, 2)(3)).toBe(6);
      expect(curriedAdd(1)(2)(3)).toBe(6);
      expect(curriedAdd(1)(2, 3)).toBe(6);
    });

    it('should handle single argument functions', () => {
      const double = (x: number) => x * 2;
      const curriedDouble = curry(double);
      expect(curriedDouble(5)).toBe(10);
    });
  });
});
