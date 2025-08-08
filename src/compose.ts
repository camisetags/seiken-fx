import { Result, success } from './result';

export const curry = (fn: (...args1: any[]) => any) => {
  return function curried(this: any, ...args2: any[]) {
    if (args2.length >= fn.length) {
      return fn.apply(this, args2);
    }
    return function (this: any, ...moreArgs: readonly any[]) {
      return curried.apply(this, args2.concat(moreArgs));
    };
  };
};

export const compose =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduceRight((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

export const pipe =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduce((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

export const composeAsync =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>) =>
  async (initial: T): Promise<Result<E, T>> => {
    let result: Result<E, T> = success(initial);

    for (let i = fns.length - 1; i >= 0; i--) {
      if (result.isFailure()) break;

      result = await fns[i]((result as any).value);
    }

    return result;
  };

export const pipeAsync =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>) =>
  async (initial: T): Promise<Result<E, T>> => {
    let result: Result<E, T> = success(initial);

    for (const fn of fns) {
      if (result.isFailure()) break;

      result = await fn((result as any).value);
    }

    return result;
  };

export interface Curry {
  (fn: Function): (...args: readonly any[]) => any;
}

export interface Compose<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Result<E, T>>): (initial: T) => Result<E, T>;
}

export interface Pipe<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Result<E, T>>): (initial: T) => Result<E, T>;
}

export interface ComposeAsync<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>): (initial: T) => Promise<Result<E, T>>;
}

export interface PipeAsync<E, T> {
  (...fns: ReadonlyArray<(arg: T) => Promise<Result<E, T>>>): (initial: T) => Promise<Result<E, T>>;
}
