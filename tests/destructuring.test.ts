import { success, failure, fromPromise, fromPromiseTuple } from '../src/result';

describe('New destructuring features', () => {
  describe('unwrap method', () => {
    it('should return tuple [value, null] for Success', () => {
      const result = success(42);
      const [value, error] = result.unwrap();

      expect(value).toBe(42);
      expect(error).toBeNull();
    });

    it('should return tuple [null, error] for Failure', () => {
      const result = failure('Something went wrong');
      const [value, error] = result.unwrap();

      expect(value).toBeNull();
      expect(error).toBe('Something went wrong');
    });
  });

  describe('fromPromise with optional onError', () => {
    it('should work with default error handling', async () => {
      const result = await fromPromise(Promise.resolve('success'));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrElse('')).toBe('success');
    });

    it('should work with custom error handling', async () => {
      const result = await fromPromise(
        Promise.reject(new Error('test error')),
        e => `Custom: ${e}`,
      );

      expect(result.isFailure()).toBe(true);
      expect((result as any).error).toBe('Custom: Error: test error');
    });

    it('should handle rejected promises with default error handling', async () => {
      const result = await fromPromise(Promise.reject(new Error('network error')));

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('fromPromiseTuple - Elixir style', () => {
    it('should return [data, null] for successful promise', async () => {
      const [data, error] = await fromPromiseTuple(Promise.resolve('user data'));

      expect(data).toBe('user data');
      expect(error).toBeNull();
    });

    it('should return [null, error] for rejected promise', async () => {
      const [data, error] = await fromPromiseTuple(Promise.reject(new Error('failed')));

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('failed');
    });

    it('should work with complex data', async () => {
      const userData = { name: 'John', age: 30 };
      const [data, error] = await fromPromiseTuple(Promise.resolve(userData));

      expect(data).toEqual(userData);
      expect(error).toBeNull();
    });
  });

  describe('hybrid usage patterns', () => {
    it('should allow Result composition then destructuring', async () => {
      const result = await fromPromise(Promise.resolve(10));
      const doubled = result.map(x => x * 2);
      const [value, error] = doubled.unwrap();

      expect(value).toBe(20);
      expect(error).toBeNull();
    });

    it('should work in error scenarios', async () => {
      const result = await fromPromise(Promise.reject(new Error('test')));
      const recovered = result.recover(_e => 'fallback');
      const [value, error] = recovered.unwrap();

      expect(value).toBe('fallback');
      expect(error).toBeNull();
    });
  });
});
