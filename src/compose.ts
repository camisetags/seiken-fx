import { Result, success } from './result';


export const compose = <T>(...fns: Array<(arg: T) => T>) =>
  (initial: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), initial);

export const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (initial: T): T =>
    fns.reduce((acc, fn) => fn(acc), initial);

export const curry = (fn: Function) => {
  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs: any[]) {
      return curried.apply(this, args.concat(moreArgs));
    }
  };
};


export const composeResult = <E, T>(...fns: Array<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduceRight(
      (acc: Result<E, T>, fn) => acc.flatMap(fn),
      success(initial)
    );
  };

export const pipeResult = <E, T>(...fns: Array<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduce(
      (acc: Result<E, T>, fn) => acc.flatMap(fn),
      success(initial)
    );
  };

export const composeAsyncResult = <E, T>(
  ...fns: Array<(arg: T) => Promise<Result<E, T>>>
) => async (initial: T): Promise<Result<E, T>> => {
  let result: Result<E, T> = success(initial);
  
  for (let i = fns.length - 1; i >= 0; i--) {
    if (result.isFailure()) break;
    
    result = await fns[i]((result as any).value);
  }
  
  return result;
};

export const pipeAsyncResult = <E, T>(
  ...fns: Array<(arg: T) => Promise<Result<E, T>>>
) => async (initial: T): Promise<Result<E, T>> => {
  let result: Result<E, T> = success(initial);
  
  for (const fn of fns) {
    if (result.isFailure()) break;
    
    result = await fn((result as any).value);
  }
  
  return result;
};
