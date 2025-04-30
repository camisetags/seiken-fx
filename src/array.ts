import { Result, success, failure, tryCatch } from './result';

// Original functions
export const map = <T, U>(fn: (x: T) => U) => (arr: T[]): U[] =>
  arr.map(fn);

export const filter = <T>(predicate: (x: T) => boolean) => (arr: T[]): T[] =>
  arr.filter(predicate);

export const reduce = <T, U>(fn: (acc: U, curr: T) => U, initial: U) => (arr: T[]): U =>
  arr.reduce(fn, initial);

export const head = <T>(arr: T[]): T | undefined =>
  arr[0];

export const tail = <T>(arr: T[]): T[] =>
  arr.slice(1);

// Result-based versions
export const mapResult = <T, U, E>(fn: (x: T) => Result<E, U>) => 
  (arr: T[]): Result<E, U[]> => {
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

export const filterResult = <T, E>(predicate: (x: T) => Result<E, boolean>) =>
  (arr: T[]): Result<E, T[]> => {
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

export const reduceResult = <T, U, E>(
  fn: (acc: U, curr: T) => Result<E, U>, 
  initial: U
) => (arr: T[]): Result<E, U> => {
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

export const headResult = <T, E>(arr: T[], errorFn: () => E): Result<E, T> => {
  if (arr.length === 0) {
    return failure(errorFn());
  }
  return success(arr[0]);
};

export const tailResult = <T>(arr: T[]): Result<never, T[]> => {
  return success(arr.slice(1));
};

export const safeArrayOp = <T, U>(fn: (arr: T[]) => U): (arr: T[]) => Result<Error, U> =>
  (arr) => tryCatch(() => fn(arr), e => e instanceof Error ? e : new Error(String(e)));
