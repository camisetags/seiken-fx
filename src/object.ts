import { Result, success, failure } from './result';

/**
 * Safely gets a property value from an object with Result-based error handling.
 * @param key The property key to extract
 * @param onMissing Function to generate error when property is missing or undefined
 * @returns Function that takes an object and returns Success with value or Failure if missing
 */
export const prop =
  <T extends object, K extends keyof T, E>(key: K, onMissing: () => E) =>
  (obj: T): Result<E, T[K]> => {
    if (!(key in obj) || obj[key] === undefined) {
      return failure(onMissing());
    }
    return success(obj[key]);
  };

/**
 * Safely picks multiple properties from an object with Result-based error handling.
 * If any property is missing, returns a Failure with the first missing property.
 * @param keys Array of property keys to include in the result
 * @param onMissing Function to generate error when a property is missing
 * @returns Function that takes an object and returns Success with picked properties or Failure if any missing
 */
export const pick =
  <T extends object, K extends keyof T, E>(keys: readonly K[], onMissing: (missingKey: K) => E) =>
  (obj: T): Result<E, Pick<T, K>> => {
    const result: Partial<Pick<T, K>> = {};

    for (const key of keys) {
      if (!(key in obj)) {
        return failure(onMissing(key));
      }
      result[key] = obj[key];
    }

    return success(result as Pick<T, K>);
  };

/**
 * Safely creates a new object excluding specified properties with Result-based handling.
 * This version always succeeds since omitting properties cannot fail.
 * @param keys Array of property keys to exclude from the result
 * @returns Function that takes an object and returns Success with omitted properties
 */
export const omit =
  <T extends object, K extends keyof T>(keys: readonly K[]) =>
  (obj: T): Result<never, Omit<T, K>> => {
    const result = Object.keys(obj)
      .filter(k => !keys.includes(k as K))
      .reduce((acc, key) => ({ ...acc, [key]: obj[key as keyof T] }), {} as Omit<T, K>);

    return success(result);
  };

/**
 * Safely accesses nested properties in an object using a path array.
 * Useful for deeply nested object access with safe error handling.
 * @param path Array of property names representing the path to the desired value
 * @param onMissing Function to generate error when any part of the path is missing
 * @returns Function that takes an object and returns Success with value or Failure if path is invalid
 */
export const getPath =
  <T, E>(path: readonly string[], onMissing: (path: string) => E) =>
  (obj: T): Result<E, unknown> => {
    let current: any = obj;

    for (const segment of path) {
      if (current === null || current === undefined || !(segment in current)) {
        return failure(onMissing(path.join('.')));
      }
      current = current[segment];
    }

    return success(current);
  };
