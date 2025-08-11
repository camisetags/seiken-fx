/**
 * Represents the result of a computation that can either succeed or fail.
 * Success contains the value of type A, while Failure contains an error of type E.
 */
export type Result<E, A> = Success<A> | Failure<E>;

class Success<A> {
  readonly _tag: 'Success' = 'Success';
  constructor(readonly value: A) {}

  isSuccess(): this is Success<A> {
    return true;
  }

  isFailure(): boolean {
    return false;
  }

  map<B>(f: (a: A) => B): Result<never, B> {
    return success(f(this.value));
  }

  flatMap<E, B>(f: (a: A) => Result<E, B>): Result<E, B> {
    return f(this.value);
  }

  mapError<E1>(_f: (e: never) => E1): Result<E1, A> {
    return this as unknown as Result<E1, A>;
  }

  recover<A1>(_f: (e: never) => A1): Result<never, A> {
    return this;
  }

  fold<B>(_onFailure: (_: never) => B, onSuccess: (a: A) => B): B {
    return onSuccess(this.value);
  }

  getOrElse<A1>(_defaultValue: A1): A {
    return this.value;
  }

  getOrThrow(): A {
    return this.value;
  }

  /**
   * Destructures the Result into a tuple [value, error] for Elixir-style pattern matching.
   * Success returns [value, null], Failure returns [null, error].
   * @returns A tuple where the first element is the value (or null) and second is the error (or null)
   */
  unwrap(): [A, null] {
    return [this.value, null];
  }
}

class Failure<E> {
  readonly _tag: 'Failure' = 'Failure';
  constructor(readonly error: E) {}

  isSuccess(): boolean {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }

  map<B>(_f: (a: never) => B): Result<E, never> {
    return this as unknown as Result<E, never>;
  }

  flatMap<E1, B>(_f: (a: never) => Result<E1, B>): Result<E | E1, never> {
    return this as unknown as Result<E, never>;
  }

  mapError<E1>(f: (e: E) => E1): Result<E1, never> {
    return failure(f(this.error));
  }

  recover<A>(f: (e: E) => A): Result<never, A> {
    return success(f(this.error));
  }

  fold<B>(onFailure: (e: E) => B, _onSuccess: (a: never) => B): B {
    return onFailure(this.error);
  }

  getOrElse<A1>(defaultValue: A1): A1 {
    return defaultValue;
  }

  getOrThrow(): never {
    throw this.error;
  }

  /**
   * Destructures the Result into a tuple [value, error] for Elixir-style pattern matching.
   * Success returns [value, null], Failure returns [null, error].
   * @returns A tuple where the first element is the value (or null) and second is the error (or null)
   */
  unwrap(): [null, E] {
    return [null, this.error];
  }
}

/**
 * Creates a successful Result containing the given value.
 * @param value The value to wrap in a Success
 * @returns A Result representing success
 */
export const success = <A>(value: A): Result<never, A> => {
  return new Success(value);
};

/**
 * Creates a failed Result containing the given error.
 * @param error The error to wrap in a Failure
 * @returns A Result representing failure
 */
export const failure = <E>(error: E): Result<E, never> => {
  return new Failure(error);
};

/**
 * Safely executes a function that might throw an exception.
 * @param f The function to execute
 * @param onError Function to transform the caught error
 * @returns Success if the function executes without throwing, Failure otherwise
 */
export const tryCatch = <E, A>(f: () => A, onError: (error: unknown) => E): Result<E, A> => {
  try {
    return success(f());
  } catch (e) {
    return failure(onError(e));
  }
};

/**
 * Converts a Promise to a Result, handling both resolved and rejected cases.
 * @param promise The Promise to convert
 * @param onError Optional function to transform the error (defaults to wrapping in Error)
 * @returns A Promise that resolves to a Result
 */
export const fromPromise = <E, A>(
  promise: Promise<A>,
  onError?: (error: unknown) => E,
): Promise<Result<E | Error, A>> => {
  if (onError) {
    return promise.then(value => success(value)).catch(error => failure(onError(error)));
  }
  return promise
    .then(value => success(value))
    .catch(error => failure(error instanceof Error ? error : new Error(String(error))));
};

/**
 * Converts a Promise to a tuple [value, error] for Elixir-style error handling.
 * Success case returns [value, null], failure case returns [null, error].
 * @param promise The Promise to convert
 * @returns A Promise that resolves to a tuple [value | null, Error | null]
 */
export const fromPromiseTuple = async <A>(
  promise: Promise<A>,
): Promise<[A | null, Error | null]> => {
  const result = await fromPromise(promise);
  return result.unwrap() as [A | null, Error | null];
};

/**
 * Combines an array of Results into a single Result containing an array of values.
 * If any Result is a Failure, returns the first Failure encountered.
 * @param results Array of Results to combine
 * @returns Success with array of values if all succeed, or first Failure encountered
 */
export const all = <E, A>(results: readonly Result<E, A>[]): Result<E, readonly A[]> => {
  const values: A[] = [];

  for (const result of results) {
    if (result.isFailure()) {
      return result as Result<E, never>;
    }
    if (result.isSuccess() && 'value' in result) {
      values.push(result.value);
    }
  }

  return success(values);
};
