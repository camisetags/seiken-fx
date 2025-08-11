import { curry, compose, pipe, composeAsync, pipeAsync } from '../src/compose';
import { success, failure, Result } from '../src/result';

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

    it('should handle functions with no arguments', () => {
      const getValue = () => 42;
      const curriedGetValue = curry(getValue);
      expect(curriedGetValue()).toBe(42);
    });

    it('should preserve context (this) when currying', () => {
      const obj = {
        multiplier: 2,
        multiply: function (a: number, b: number) {
          return a * b * this.multiplier;
        },
      };

      const curriedMultiply = curry(obj.multiply.bind(obj));
      expect(curriedMultiply(3, 4)).toBe(24);
      expect(curriedMultiply(3)(4)).toBe(24);
    });
  });

  describe('compose', () => {
    const double = (x: number): Result<string, number> => success(x * 2);
    const addOne = (x: number): Result<string, number> => success(x + 1);
    const subtract = (x: number): Result<string, number> => success(x - 3);
    const failOnNegative = (x: number): Result<string, number> =>
      x < 0 ? failure('Negative number') : success(x);

    it('should compose functions from right to left', () => {
      const composed = compose(double, addOne, subtract);
      const result = composed(10);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(16); // (10 - 3 + 1) * 2 = 16
      expect(error).toBe(null);
    });

    it('should handle single function composition', () => {
      const composed = compose(double);
      const result = composed(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(10);
      expect(error).toBe(null);
    });

    it('should handle empty composition', () => {
      const composed = compose<string, number>();
      const result = composed(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(5);
      expect(error).toBe(null);
    });

    it('should short-circuit on failure', () => {
      const composed = compose(double, addOne, failOnNegative, subtract);
      const result = composed(2);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Negative number');
    });
  });

  describe('pipe', () => {
    const double = (x: number): Result<string, number> => success(x * 2);
    const addOne = (x: number): Result<string, number> => success(x + 1);
    const subtract = (x: number): Result<string, number> => success(x - 3);
    const failOnNegative = (x: number): Result<string, number> =>
      x < 0 ? failure('Negative number') : success(x);

    it('should pipe functions from left to right', () => {
      const piped = pipe(subtract, addOne, double);
      const result = piped(10);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(16); // (10 - 3 + 1) * 2 = 16
      expect(error).toBe(null);
    });

    it('should handle single function pipe', () => {
      const piped = pipe(double);
      const result = piped(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(10);
      expect(error).toBe(null);
    });

    it('should handle empty pipe', () => {
      const piped = pipe<string, number>();
      const result = piped(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(5);
      expect(error).toBe(null);
    });

    it('should short-circuit on failure', () => {
      const piped = pipe(subtract, failOnNegative, addOne, double);
      const result = piped(2);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Negative number');
    });
  });

  describe('composeAsync', () => {
    const doubleAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x * 2));
    const addOneAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x + 1));
    const subtractAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x - 3));
    const failOnNegativeAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(x < 0 ? failure('Negative number') : success(x));

    it('should compose async functions from right to left', async () => {
      const composed = composeAsync(doubleAsync, addOneAsync, subtractAsync);
      const result = await composed(10);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(16); // (10 - 3 + 1) * 2 = 16
      expect(error).toBe(null);
    });

    it('should handle single async function composition', async () => {
      const composed = composeAsync(doubleAsync);
      const result = await composed(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(10);
      expect(error).toBe(null);
    });

    it('should handle empty async composition', async () => {
      const composed = composeAsync<string, number>();
      const result = await composed(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(5);
      expect(error).toBe(null);
    });

    it('should short-circuit on async failure', async () => {
      const composed = composeAsync(doubleAsync, addOneAsync, failOnNegativeAsync, subtractAsync);
      const result = await composed(2);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Negative number');
    });
  });

  describe('pipeAsync', () => {
    const doubleAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x * 2));
    const addOneAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x + 1));
    const subtractAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(success(x - 3));
    const failOnNegativeAsync = async (x: number): Promise<Result<string, number>> =>
      Promise.resolve(x < 0 ? failure('Negative number') : success(x));

    it('should pipe async functions from left to right', async () => {
      const piped = pipeAsync(subtractAsync, addOneAsync, doubleAsync);
      const result = await piped(10);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(16); // (10 - 3 + 1) * 2 = 16
      expect(error).toBe(null);
    });

    it('should handle single async function pipe', async () => {
      const piped = pipeAsync(doubleAsync);
      const result = await piped(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(10);
      expect(error).toBe(null);
    });

    it('should handle empty async pipe', async () => {
      const piped = pipeAsync<string, number>();
      const result = await piped(5);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(5);
      expect(error).toBe(null);
    });

    it('should short-circuit on async failure', async () => {
      const piped = pipeAsync(subtractAsync, failOnNegativeAsync, addOneAsync, doubleAsync);
      const result = await piped(2);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Negative number');
    });
  });
});
