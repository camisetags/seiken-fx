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

  describe('conditional execution with .if().then().else()', () => {
    it('should execute .then() when condition is true for Success', () => {
      const thenMock = jest.fn();
      const elseMock = jest.fn();
      const result = success(15);

      result
        .if((value: any) => value > 10)
        .then(thenMock)
        .else(elseMock);

      expect(thenMock).toHaveBeenCalledWith(15);
      expect(elseMock).not.toHaveBeenCalled();
    });

    it('should execute .else() when condition is false for Success', () => {
      const thenMock = jest.fn();
      const elseMock = jest.fn();
      const result = success(5);

      result
        .if((value: any) => value > 10)
        .then(thenMock)
        .else(elseMock);

      expect(thenMock).not.toHaveBeenCalled();
      expect(elseMock).toHaveBeenCalledWith(5);
    });

    it('should always execute .else() for Failure regardless of predicate', () => {
      const thenMock = jest.fn();
      const elseMock = jest.fn();
      const result = failure('error occurred');

      result
        .if(_value => true)
        .then(thenMock)
        .else(elseMock);

      expect(thenMock).not.toHaveBeenCalled();
      expect(elseMock).toHaveBeenCalledWith('error occurred');
    });

    it('should execute .then() and return ConditionalChain for continued chaining', () => {
      const mock1 = jest.fn();
      const result = success(20);

      const returned = result.if((value: any) => value > 10).then(mock1);

      expect(mock1).toHaveBeenCalledWith(20);
      expect(returned).not.toBe(result);
      expect(typeof returned).toBe('object');
      expect(returned).toHaveProperty('then');
      expect(returned).toHaveProperty('else');
    });

    it('should work with complex predicates', () => {
      const user = { id: 1, name: 'John', age: 25 };
      const result = success(user);
      const adultMock = jest.fn();
      const minorMock = jest.fn();

      result
        .if(user => user.age >= 18)
        .then(adultMock)
        .else(minorMock);

      expect(adultMock).toHaveBeenCalledWith(user);
      expect(minorMock).not.toHaveBeenCalled();
    });

    it('should work with string predicates', () => {
      const result = success('hello world');
      const longMock = jest.fn();
      const shortMock = jest.fn();

      result
        .if(str => str.length > 10)
        .then(longMock)
        .else(shortMock);

      expect(longMock).toHaveBeenCalledWith('hello world');
      expect(shortMock).not.toHaveBeenCalled();
    });

    it('should return the original Result from .else() for continued chaining', () => {
      const result = success(42);

      const returned = result
        .if(_value => false)
        .then(_value => console.log('Large number'))
        .else(_value => console.log('Small number'));

      expect(returned).toBe(result);
    });

    it('should handle edge case with zero', () => {
      const result = success(0);
      const positiveMock = jest.fn();
      const zeroMock = jest.fn();

      result
        .if((value: any) => value > 0)
        .then(positiveMock)
        .else(zeroMock);

      expect(positiveMock).not.toHaveBeenCalled();
      expect(zeroMock).toHaveBeenCalledWith(0);
    });
  });

  describe('pattern matching with .match()', () => {
    it('should execute basic success pattern', () => {
      const result = success('hello world');
      const mockFn = jest.fn();

      const output = result.match([
        [success, mockFn],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(mockFn).toHaveBeenCalledWith('hello world');
      expect(output).toBeUndefined(); // mockFn returns void
    });

    it('should execute failure pattern for Failure', () => {
      const result = failure('database error');

      const output = result.match([
        [success, (value: any) => `Success: ${value}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Error: database error');
    });

    it('should execute guard pattern when condition is true', () => {
      const result = success(15);

      const output = result.match([
        [success, (value: any) => value > 10, (value: any) => `Large: ${value}`],
        [success, (value: any) => value <= 10, (value: any) => `Small: ${value}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Large: 15');
    });

    it('should execute guard pattern when condition is false', () => {
      const result = success(5);

      const output = result.match([
        [success, (value: any) => value > 10, (value: any) => `Large: ${value}`],
        [success, (value: any) => value <= 10, (value: any) => `Small: ${value}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Small: 5');
    });

    it('should execute destructuring pattern when object matches', () => {
      const user = { id: 1, name: 'John', age: 25 };
      const result = success(user);

      const output = result.match([
        [success, { age: 25 }, (user: any) => `Adult: ${user.name}`],
        [success, { age: 18 }, (user: any) => `Young: ${user.name}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Adult: John');
    });

    it('should execute destructuring pattern with partial match', () => {
      const user = { id: 1, name: 'John', age: 25 };
      const result = success(user);

      const output = result.match([
        [success, (user: any) => user.age === 30, (user: any) => `Old: ${user.name}`],
        [success, (user: any) => user.age === 18, (user: any) => `Young: ${user.name}`],
        [success, (_user: any) => true, (user: any) => `Age: ${user.age}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Age: 25');
    });

    it('should execute first matching pattern in order', () => {
      const result = success(15);

      const output = result.match([
        [success, (value: any) => value > 20, (value: any) => `Very large: ${value}`],
        [success, (value: any) => value > 10, (value: any) => `Large: ${value}`],
        [success, (value: any) => value > 0, (value: any) => `Positive: ${value}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Large: 15');
    });

    it('should throw error when no pattern matches', () => {
      const result = success(5);

      expect(() => {
        result.match([
          [success, (value: any) => value > 10, (value: any) => `Large: ${value}`],
          [failure, (error: any) => `Error: ${error}`],
        ]);
      }).toThrow('No matching pattern found');
    });

    it('should throw error when no failure pattern matches', () => {
      const result = failure('database error');

      expect(() => {
        result.match([[success, (value: any) => `Success: ${value}`]]);
      }).toThrow('No matching failure pattern found');
    });

    it('should work with complex nested objects', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              language: 'en',
            },
          },
        },
      };
      const result = success(data);

      const output = result.match([
        [
          success,
          (data: any) => data.user?.profile?.preferences?.theme === 'dark',
          (_data: any) => 'Dark theme user',
        ],
        [
          success,
          (data: any) => data.user?.profile?.preferences?.theme === 'light',
          (_data: any) => 'Light theme user',
        ],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Dark theme user');
    });

    it('should work with array patterns', () => {
      const result = success([1, 2, 3, 4, 5]);

      const output = result.match([
        [success, (arr: any) => arr.length > 10, (arr: any) => `Long array: ${arr.length}`],
        [success, (arr: any) => arr.length > 5, (arr: any) => `Medium array: ${arr.length}`],
        [success, (arr: any) => arr.length > 0, (arr: any) => `Short array: ${arr.length}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Short array: 5');
    });

    it('should handle multiple guard conditions', () => {
      const result = success(42);

      const output = result.match([
        [success, (value: any) => value > 100, (value: any) => `Huge: ${value}`],
        [success, (value: any) => value > 50, (value: any) => `Large: ${value}`],
        [success, (value: any) => value > 25, (value: any) => `Medium: ${value}`],
        [success, (value: any) => value > 0, (value: any) => `Small: ${value}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Medium: 42');
    });

    it('should work with string patterns', () => {
      const result = success('hello world');

      const output = result.match([
        [
          success,
          (str: any) => str.includes('hello') && str.includes('world'),
          (str: any) => `Complete: ${str}`,
        ],
        [success, (str: any) => str.includes('hello'), (str: any) => `Partial: ${str}`],
        [success, (str: any) => str.length > 0, (str: any) => `Any: ${str}`],
        [failure, (error: any) => `Error: ${error}`],
      ]);

      expect(output).toBe('Complete: hello world');
    });
  });
});
