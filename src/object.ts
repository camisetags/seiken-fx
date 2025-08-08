import { Result, success, failure } from './result';

export const prop =
  <T extends object, K extends keyof T>(key: K) =>
  (obj: T): T[K] =>
    obj[key];

export const pick =
  <T extends object, K extends keyof T>(keys: readonly K[]) =>
  (obj: T): Pick<T, K> =>
    keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>);

export const omit =
  <T extends object, K extends keyof T>(keys: readonly K[]) =>
  (obj: T): Omit<T, K> =>
    Object.keys(obj)
      .filter(k => !keys.includes(k as K))
      .reduce((acc, key) => ({ ...acc, [key]: obj[key as keyof T] }), {} as Omit<T, K>);

export const propResult =
  <T extends object, K extends keyof T, E>(key: K, onMissing: () => E) =>
  (obj: T): Result<E, T[K]> => {
    if (!(key in obj) || obj[key] === undefined) {
      return failure(onMissing());
    }
    return success(obj[key]);
  };

export const pickResult =
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

export const omitResult =
  <T extends object, K extends keyof T>(keys: readonly K[]) =>
  (obj: T): Result<never, Omit<T, K>> => {
    const result = Object.keys(obj)
      .filter(k => !keys.includes(k as K))
      .reduce((acc, key) => ({ ...acc, [key]: obj[key as keyof T] }), {} as Omit<T, K>);

    return success(result);
  };

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
