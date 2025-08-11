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

/**
 * Safely transforms all values in an object using a mapping function.
 * @param mapper Function to transform each value
 * @param onError Function to generate error when transformation fails
 * @returns Function that takes an object and returns Success with transformed values or Failure if any transformation fails
 */
export const mapValues =
  <T extends object, U, E>(
    mapper: (value: T[keyof T], key: keyof T) => Result<E, U>,
    onError: (error: E, key: keyof T) => E,
  ) =>
  (obj: T): Result<E, Record<keyof T, U>> => {
    const result = {} as Record<keyof T, U>;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const mappedResult = mapper(obj[key], key);
        if (mappedResult.isFailure()) {
          const [, error] = mappedResult.unwrap();
          return failure(onError(error!, key));
        }
        const [value] = mappedResult.unwrap();
        result[key] = value!;
      }
    }

    return success(result);
  };

/**
 * Safely checks if a property exists in an object.
 * @param key The property key to check
 * @returns Function that takes an object and returns Success with boolean indicating existence
 */
export const has =
  <T extends object, K extends PropertyKey>(key: K) =>
  (obj: T): Result<never, boolean> => {
    return success(key in obj);
  };

/**
 * Safely filters an object by its values using a predicate function.
 * @param predicate Function to test each value
 * @param onError Function to generate error when predicate fails
 * @returns Function that takes an object and returns Success with filtered object or Failure if predicate fails
 */
export const filterValues =
  <T extends object, E>(
    predicate: (value: T[keyof T], key: keyof T) => Result<E, boolean>,
    onError: (error: E, key: keyof T) => E,
  ) =>
  (obj: T): Result<E, Partial<T>> => {
    const result: Partial<T> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const predicateResult = predicate(obj[key], key);
        if (predicateResult.isFailure()) {
          const [, error] = predicateResult.unwrap();
          return failure(onError(error!, key));
        }
        const [shouldInclude] = predicateResult.unwrap();
        if (shouldInclude) {
          result[key] = obj[key];
        }
      }
    }

    return success(result);
  };

/**
 * Safely removes null and undefined values from an object.
 * @returns Function that takes an object and returns Success with compacted object
 */
export const compact =
  <T extends object>() =>
  (obj: T): Result<never, Partial<T>> => {
    const result: Partial<T> = {};

    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        obj[key] !== null &&
        obj[key] !== undefined
      ) {
        result[key] = obj[key];
      }
    }

    return success(result);
  };

/**
 * Safely checks if an object is empty (has no own enumerable properties).
 * @returns Function that takes an object and returns Success with boolean indicating if empty
 */
export const isObjectEmpty =
  <T extends object>() =>
  (obj: T): Result<never, boolean> => {
    return success(Object.keys(obj).length === 0);
  };

/**
 * Safely merges multiple objects with deep merge strategy.
 * @param onConflict Function to handle merge conflicts
 * @returns Function that takes objects and returns Success with merged object or Failure on conflict
 */
export const merge =
  <T extends object, E>(
    onConflict: (key: string, target: unknown, source: unknown) => Result<E, unknown>,
  ) =>
  (...sources: T[]): Result<E, T> => {
    const result: any = {};

    for (const source of sources) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (key in result) {
            const conflictResult = onConflict(key, result[key], source[key]);
            if (conflictResult.isFailure()) {
              return conflictResult as Result<E, T>;
            }
            const [resolvedValue] = conflictResult.unwrap();
            result[key] = resolvedValue;
          } else {
            result[key] = source[key];
          }
        }
      }
    }

    return success(result);
  };

/**
 * Safely applies default values to an object for missing properties.
 * @param defaults Object containing default values
 * @returns Function that takes an object and returns Success with defaults applied
 */
export const defaults =
  <T extends object, D extends Partial<T>>(defaultValues: D) =>
  (obj: T): Result<never, T & D> => {
    const result = { ...defaultValues, ...obj } as T & D;
    return success(result);
  };

/**
 * Safely gets all keys from an object.
 * @returns Function that takes an object and returns Success with array of keys
 */
export const keys =
  <T extends object>() =>
  (obj: T): Result<never, (keyof T)[]> => {
    return success(Object.keys(obj) as (keyof T)[]);
  };

/**
 * Safely gets all values from an object.
 * @returns Function that takes an object and returns Success with array of values
 */
export const values =
  <T extends object>() =>
  (obj: T): Result<never, T[keyof T][]> => {
    return success(Object.values(obj) as T[keyof T][]);
  };

/**
 * Safely gets all key-value pairs from an object.
 * @returns Function that takes an object and returns Success with array of [key, value] tuples
 */
export const entries =
  <T extends object>() =>
  (obj: T): Result<never, [keyof T, T[keyof T]][]> => {
    return success(Object.entries(obj) as [keyof T, T[keyof T]][]);
  };

/**
 * Options for deep cloning operations.
 */
export interface CloneOptions {
  /** Maximum depth to clone (default: 10) */
  maxDepth?: number;
  /** Whether to clone functions (default: false) */
  cloneFunctions?: boolean;
}

/**
 * Safely performs deep clone of an object with configurable depth protection.
 * @param options Configuration options for cloning behavior
 * @param onDepthExceeded Function to generate error when max depth is exceeded
 * @returns Function that takes an object and returns Success with cloned object or Failure if depth exceeded
 */
export const clone =
  <T, E>(options: CloneOptions = {}, onDepthExceeded: (depth: number) => E) =>
  (obj: T): Result<E, T> => {
    const { maxDepth = 10, cloneFunctions = false } = options;

    const cloneRecursive = (value: any, currentDepth: number): Result<E, any> => {
      if (currentDepth > maxDepth) {
        return failure(onDepthExceeded(currentDepth));
      }

      if (value === null || typeof value !== 'object') {
        if (typeof value === 'function' && !cloneFunctions) {
          return success(value); // Return function as-is if not cloning functions
        }
        return success(value);
      }

      if (Array.isArray(value)) {
        const clonedArray: any[] = [];
        for (let i = 0; i < value.length; i++) {
          const clonedItem = cloneRecursive(value[i], currentDepth + 1);
          if (clonedItem.isFailure()) {
            return clonedItem;
          }
          const [item] = clonedItem.unwrap();
          clonedArray[i] = item;
        }
        return success(clonedArray);
      }

      const clonedObj: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const clonedValue = cloneRecursive(value[key], currentDepth + 1);
          if (clonedValue.isFailure()) {
            return clonedValue;
          }
          const [val] = clonedValue.unwrap();
          clonedObj[key] = val;
        }
      }
      return success(clonedObj);
    };

    return cloneRecursive(obj, 0);
  };
