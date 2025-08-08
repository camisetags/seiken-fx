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

  unwrap(): [null, E] {
    return [null, this.error];
  }
}

// Constructors
export const success = <A>(value: A): Result<never, A> => {
  return new Success(value);
};

export const failure = <E>(error: E): Result<E, never> => {
  return new Failure(error);
};

// Utility functions
export const tryCatch = <E, A>(f: () => A, onError: (error: unknown) => E): Result<E, A> => {
  try {
    return success(f());
  } catch (e) {
    return failure(onError(e));
  }
};

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

// Helper that returns tuple for Elixir-style destructuring
export const fromPromiseTuple = async <A>(
  promise: Promise<A>,
): Promise<[A | null, Error | null]> => {
  const result = await fromPromise(promise);
  return result.unwrap() as [A | null, Error | null];
};

// Combinators
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
