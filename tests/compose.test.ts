import { compose, pipe, curry } from '../src/compose';

describe('Composition utilities', () => {
  describe('compose', () => {
    it('should compose functions from right to left', () => {
      const add5 = (x: number) => x + 5;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;

      const composed = compose(add5, multiply2, subtract3);
      // ((10 - 3) * 2) + 5 = 19
      expect(composed(10)).toBe(19);
    });

    it('should handle single function', () => {
      const add5 = (x: number) => x + 5;
      const composed = compose(add5);
      expect(composed(10)).toBe(15);
    });

    it('should handle no functions', () => {
      const composed = compose();
      expect(composed(10)).toBe(10);
    });
  });

  describe('pipe', () => {
    it('should pipe functions from left to right', () => {
      const add5 = (x: number) => x + 5;
      const multiply2 = (x: number) => x * 2;
      const subtract3 = (x: number) => x - 3;

      const piped = pipe(subtract3, multiply2, add5);
      // ((10 - 3) * 2) + 5 = 19
      expect(piped(10)).toBe(19);
    });

    it('should handle single function', () => {
      const add5 = (x: number) => x + 5;
      const piped = pipe(add5);
      expect(piped(10)).toBe(15);
    });

    it('should handle no functions', () => {
      const piped = pipe();
      expect(piped(10)).toBe(10);
    });
  });

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
