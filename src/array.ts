import { Result, success, failure } from './result';

/**
 * Transforms each element of an array using a function that returns a Result.
 * If any transformation fails, returns the first failure encountered.
 * @param fn Function that transforms each element and may fail
 * @returns Function that takes an array and returns a Result of transformed array
 *
 * @example
 * ```typescript
 * // Type inference works automatically
 * const numbers = [1, 2, 3];
 * const doubled = map((n: number) => success(n * 2))(numbers);
 *
 * // Or with explicit typing
 * const mapDouble = map<number, number, string>((n) => success(n * 2));
 * ```
 */
export function map<T, U, E>(
  fn: (x: T) => Result<E, U>,
): (arr: readonly T[]) => Result<E, readonly U[]>;
export function map<T, U, E>(
  fn: (x: T) => Result<E, U>,
  arr: readonly T[],
): Result<E, readonly U[]>;
export function map<T, U, E>(fn: (x: T) => Result<E, U>, arr?: readonly T[]): any {
  if (arr !== undefined) {
    // Direct call with both arguments
    return mapImpl(fn)(arr);
  }
  // Curried call
  return mapImpl(fn);
}

const mapImpl =
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

/**
 * Filters an array using a predicate function that returns a Result.
 * If any predicate evaluation fails, returns the first failure encountered.
 * @param predicate Function that tests each element and may fail
 * @returns Function that takes an array and returns a Result of filtered array
 */
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

/**
 * Reduces an array to a single value using a function that returns a Result.
 * If any reduction step fails, returns the first failure encountered.
 * @param fn Function that combines accumulator and current element, may fail
 * @param initial Initial value for the accumulator
 * @returns Function that takes an array and returns a Result of the reduced value
 */
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

/**
 * Safely gets the first element of an array.
 * @param arr The array to get the head from
 * @param errorFn Function to generate error if array is empty
 * @returns Success with first element, or Failure if array is empty
 */
export const head = <T, E>(arr: readonly T[], errorFn: () => E): Result<E, T> => {
  if (arr.length === 0) {
    return failure(errorFn());
  }
  return success(arr[0]);
};

/**
 * Gets all elements except the first from an array.
 * @param arr The array to get the tail from
 * @returns Success with array of remaining elements (empty array if original was empty)
 */
export const tail = <T>(arr: readonly T[]): Result<never, readonly T[]> => {
  return success(arr.slice(1));
};

/**
 * Safely accesses an array element by index.
 * @param index The index to access
 * @param errorFn Function to generate error if index is out of bounds
 * @returns Function that takes an array and returns Success with element or Failure if out of bounds
 */
export const get =
  <T, E>(index: number, errorFn: (index: number) => E) =>
  (arr: readonly T[]): Result<E, T> => {
    if (index < 0 || index >= arr.length) {
      return failure(errorFn(index));
    }
    return success(arr[index]);
  };

/**
 * Checks if an array is empty.
 * @param arr The array to check
 * @returns Success with true if empty, false otherwise
 */
export const isEmpty = <T>(arr: readonly T[]): Result<never, boolean> => {
  return success(arr.length === 0);
};

/**
 * Gets the length of an array safely.
 * @param arr The array to get the length of
 * @returns Success with the array length
 */
export const length = <T>(arr: readonly T[]): Result<never, number> => {
  return success(arr.length);
};
