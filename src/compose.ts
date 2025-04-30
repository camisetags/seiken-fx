import { Result, success } from './result';

export const compose =
  <T>(...fns: ReadonlyArray<(arg: T) => T>) =>
  (initial: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), initial);

export const pipe =
  <T>(...fns: ReadonlyArray<(arg: T) => T>) =>
  (initial: T): T =>
    fns.reduce((acc, fn) => fn(acc), initial);

export const curry = (fn: (...args1: any[]) => any) => {
  return function curried(this: any, ...args2: any[]) {
    if (args2.length >= fn.length) {
      return fn.apply(this, args2);
    }
    return function (this: any, ...moreArgs: readonly any[]) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
};

export const composeResult =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduceRight((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

export const pipeResult =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduce((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

export const composeAsyncResult =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>) =>
  async (initial: T): Promise<Result<E, T>> => {
    let result: Result<E, T> = success(initial);

    for (let i = fns.length - 1; i >= 0; i--) {
      if (result.isFailure()) break;

      result = await fns[i]((result as any).value);
    }

    return result;
  };

export const pipeAsyncResult =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>) =>
  async (initial: T): Promise<Result<E, T>> => {
    let result: Result<E, T> = success(initial);

    for (const fn of fns) {
      if (result.isFailure()) break;

      result = await fn((result as any).value);
    }

    return result;
  };

export interface Compose<T> {
  (...fns: ReadonlyArray<(arg: T) => T>): (initial: T) => T;
}

export interface Pipe<T> {
  (...fns: ReadonlyArray<(arg: T) => T>): (initial: T) => T;
}

export interface Curry {
  (fn: Function): (...args: readonly any[]) => any;
}

export interface ComposeResult<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Result<E, T>>): (initial: T) => Result<E, T>;
}

export interface PipeResult<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Result<E, T>>): (initial: T) => Result<E, T>;
}

export interface ComposeAsyncResult<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>): (initial: T) => Promise<Result<E, T>>;
}

export interface PipeAsyncResult<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>): (initial: T) => Promise<Result<E, T>>;
}
