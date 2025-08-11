import { Result, success } from './result';

/**
 * Creates a curried version of a function, allowing partial application.
 * @param fn The function to curry
 * @returns A curried function that can be called with partial arguments
 */
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

/**
 * Composes functions from right to left, with Result-based error handling.
 * Each function receives the output of the function to its right.
 * @param fns Functions to compose, each returning a Result
 * @returns Function that applies the composition to an initial value
 */
export const compose =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduceRight((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

/**
 * Pipes functions from left to right, with Result-based error handling.
 * Each function receives the output of the function to its left.
 * @param fns Functions to pipe, each returning a Result
 * @returns Function that applies the pipeline to an initial value
 */
export const pipe =
  <E, T>(...fns: ReadonlyArray<(arg: T) => Result<E, T>>) =>
  (initial: T): Result<E, T> => {
    return fns.reduce((acc: Result<E, T>, fn) => acc.flatMap(fn), success(initial));
  };

/**
 * Composes async functions from right to left, with Result-based error handling.
 * Each function receives the output of the function to its right.
 * @param fns Async functions to compose, each returning a Promise<Result>
 * @returns Async function that applies the composition to an initial value
 */
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

/**
 * Pipes async functions from left to right, with Result-based error handling.
 * Each function receives the output of the function to its left.
 * @param fns Async functions to pipe, each returning a Promise<Result>
 * @returns Async function that applies the pipeline to an initial value
 */
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
