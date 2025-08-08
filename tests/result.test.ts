import { success, failure, tryCatch, fromPromise, all, Result } from '../src/result';

describe('Result utilities', () => {
  describe('success', () => {
    it('should create a Success instance', () => {
      const result = success(42);
      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result._tag).toBe('Success');
      expect(result.getOrElse(0)).toBe(42);
    });
  });

  describe('failure', () => {
    it('should create a Failure instance', () => {
      const error = new Error('Something went wrong');
      const result = failure(error);
      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result._tag).toBe('Failure');
      expect(result.getOrElse(42)).toBe(42);
      expect(() => result.getOrThrow()).toThrow(error);
    });
  });

  describe('map', () => {
    it('should transform Success value', () => {
      const result = success(5).map(x => x * 2);
      expect(result.getOrElse(0)).toBe(10);
    });

    it('should not affect Failure', () => {
      const error = new Error('error');
      const result = failure<Error>(error).map(x => x * 2);
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('flatMap', () => {
    it('should chain Success computations', () => {
      const divide = (a: number, b: number): Result<string, number> =>
        b === 0 ? failure('Division by zero') : success(a / b);

      const result = success(10).flatMap(x => divide(x, 2));
      expect(result.getOrElse(0)).toBe(5);
    });

    it('should not apply function to Failure', () => {
      const divide = (a: number, b: number): Result<string, number> =>
        b === 0 ? failure('Division by zero') : success(a / b);

      const error = 'Initial error';
      const result = failure<string>(error).flatMap(x => divide(x, 2));
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe(error);
    });
  });

  describe('mapError', () => {
    it('should transform error in Failure', () => {
      const result = failure('error').mapError(e => `Transformed: ${e}`);
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Transformed: error');
    });

    it('should not affect Success', () => {
      const value = 42;
      const result = success<number>(value).mapError(e => `Transformed: ${e}`);
      expect(result.isSuccess()).toBe(true);
      expect((result as any).value).toBe(value);
    });
  });

  describe('recover', () => {
    it('should recover from Failure', () => {
      const result = failure<string>('error').recover(e => e.length);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(5); // 'error' has length 5
    });

    it('should not affect Success', () => {
      const value = 42;
      const result = success<number>(value).recover(_e => 0);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(value);
    });
  });

  describe('fold', () => {
    it('should apply onSuccess function to Success', () => {
      const result = success(5).fold(
        e => `Error: ${e}`,
        v => `Value: ${v}`,
      );
      expect(result).toBe('Value: 5');
    });

    it('should apply onFailure function to Failure', () => {
      const result = failure('error').fold(
        e => `Error: ${e}`,
        v => `Value: ${v}`,
      );
      expect(result).toBe('Error: error');
    });
  });

  describe('tryCatch', () => {
    it('should return Success for successful computation', () => {
      const result = tryCatch(
        () => 42,
        err => `Unexpected error: ${err}`,
      );
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(42);
    });

    it('should return Failure for failed computation', () => {
      const result = tryCatch(
        () => {
          throw new Error('boom!');
        },
        err => `Caught error: ${(err as Error).message}`,
      );
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Caught error: boom!');
    });
  });

  describe('fromPromise', () => {
    it('should convert resolved Promise to Success', async () => {
      const promise = Promise.resolve(42);
      const result = await fromPromise(promise, err => `Promise error: ${err}`);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse(0)).toBe(42);
    });

    it('should convert rejected Promise to Failure', async () => {
      const promise = Promise.reject(new Error('rejected'));
      const result = await fromPromise(promise, err => `Promise error: ${(err as Error).message}`);
      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Promise error: rejected');
    });
  });

  describe('all', () => {
    it('should combine all Success values into a single Success', () => {
      const results: Result<string, number>[] = [success(1), success(2), success(3)];
      const combined = all(results);
      expect(combined.isSuccess()).toBe(true);
      expect(combined.getOrElse([])).toEqual([1, 2, 3]);
    });

    it('should return first Failure when any Result is a Failure', () => {
      const error = 'Second item failed';
      const results: Result<string, number>[] = [success(1), failure(error), success(3)];
      const combined = all(results);
      expect(combined.isFailure()).toBe(true);
      expect((combined as any).error).toBe(error);
    });

    it('should return Success with empty array for empty input', () => {
      const results: Result<string, number>[] = [];
      const combined = all(results);
      expect(combined.isSuccess()).toBe(true);
      expect(combined.getOrElse(null)).toEqual([]);
    });
  });
});
