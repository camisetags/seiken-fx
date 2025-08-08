import { Result, success, failure } from './result';

// Result-based array functions for safe functional programming
export const map =
  <T, U, E>(fn: (x: T) => Result<E, U>) =>
  (arr: readonly T[]): Result<E, readonly U[]> => {
    const results: Result<E, U>[] = [];

    for (const item of arr) {
      const result = fn(item);
      if (result.isFailure()) {
        return result as Result<E, never>;
      }
      results.push(result);
    }

    return success(results.map(r => (r as any).value));
  };

export const filter =
  <T, E>(predicate: (x: T) => Result<E, boolean>) =>
  (arr: readonly T[]): Result<E, readonly T[]> => {
    const filtered: T[] = [];

    for (const item of arr) {
      const result = predicate(item);

      if (result.isFailure()) {
        return result as Result<E, never>;
      }

      if (result.getOrElse(false)) {
        filtered.push(item);
      }
    }

    return success(filtered);
  };

export const reduce =
  <T, U, E>(fn: (acc: U, curr: T) => Result<E, U>, initial: U) =>
  (arr: readonly T[]): Result<E, U> => {
    let acc: U = initial;

    for (const item of arr) {
      const result = fn(acc, item);
      if (result.isFailure()) {
        return result;
      }
      acc = result.getOrElse(initial);
    }

    return success(acc);
  };

export const head = <T, E>(arr: readonly T[], errorFn: () => E): Result<E, T> => {
  if (arr.length === 0) {
    return failure(errorFn());
  }
  return success(arr[0]);
};

export const tail = <T>(arr: readonly T[]): Result<never, readonly T[]> => {
  return success(arr.slice(1));
};

// Safely access array elements by index
export const get =
  <T, E>(index: number, errorFn: (index: number) => E) =>
  (arr: readonly T[]): Result<E, T> => {
    if (index < 0 || index >= arr.length) {
      return failure(errorFn(index));
    }
    return success(arr[index]);
  };

// Check if array is empty
export const isEmpty = <T>(arr: readonly T[]): Result<never, boolean> => {
  return success(arr.length === 0);
};

// Get array length safely
export const length = <T>(arr: readonly T[]): Result<never, number> => {
  return success(arr.length);
};
