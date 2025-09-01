/**
 * Represents the result of a computation that can either succeed or fail.
 * Success contains the value of type A, while Failure contains an error of type E.
 */

// Extend the Result type to include the if/else methods
export interface ResultMethods<E, A> {
  if(f: (a: A) => boolean): ConditionalChain<E, A>;
  else(f: (e: E) => void): Result<E, A>;
  match<R>(patterns: Pattern<E, A, R>[]): R;
}

// Pattern matching types for Elixir-style matching
export type Pattern<E, A, R> =
  | [typeof success, (value: A) => R] // Basic success pattern
  | [typeof success, (value: A) => boolean, (value: A) => R] // Success with guard
  | [typeof success, object, (value: A) => R] // Success with destructuring
  | [typeof failure, (error: E) => R]; // Failure pattern

// Type guard to check if a pattern is a destructuring pattern
function isDestructuringPattern<E, A, R>(
  pattern: Pattern<E, A, R>,
): pattern is [typeof success, object, (value: A) => R] {
  return pattern.length === 3 && pattern[0] === success && typeof pattern[1] === 'object';
}

// Type guard to check if a pattern is a guard pattern
function isGuardPattern<E, A, R>(
  pattern: Pattern<E, A, R>,
): pattern is [typeof success, (value: A) => boolean, (value: A) => R] {
  return pattern.length === 3 && pattern[0] === success && typeof pattern[1] === 'function';
}

// Type guard to check if a pattern is a basic success pattern
function isBasicSuccessPattern<E, A, R>(
  pattern: Pattern<E, A, R>,
): pattern is [typeof success, (value: A) => R] {
  return pattern.length === 2 && pattern[0] === success;
}

// Type guard to check if a pattern is a failure pattern
function isFailurePattern<E, A, R>(
  pattern: Pattern<E, A, R>,
): pattern is [typeof failure, (error: E) => R] {
  return pattern[0] === failure;
}

// Define the Result type
export type Result<E, A> = Success<A> | Failure<E>;

class Success<A> {
  readonly _tag: 'Success' = 'Success';
  constructor(readonly value: A) {}

  /**
   * Type guard to check if this Result is a Success.
   * @returns true, as this is always a Success instance
   */
  isSuccess(): this is Success<A> {
    return true;
  }

  /**
   * Type guard to check if this Result is a Failure.
   * @returns false, as this is always a Success instance
   */
  isFailure(): boolean {
    return false;
  }

  /**
   * Transforms the value inside this Success using the provided function.
   * @param f Function to transform the value
   * @returns A new Success containing the transformed value
   */
  map<B>(f: (a: A) => B): Result<never, B> {
    return success(f(this.value));
  }

  /**
   * Chains this Success with another Result-producing function.
   * @param f Function that takes the value and returns a Result
   * @returns The Result returned by the function
   */
  flatMap<E, B>(f: (a: A) => Result<E, B>): Result<E, B> {
    return f(this.value);
  }

  /**
   * Does nothing for Success since there's no error to transform.
   * @param _f Function to transform the error (unused)
   * @returns This Success instance unchanged
   */
  mapError<E1>(_f: (e: never) => E1): Result<E1, A> {
    return this as unknown as Result<E1, A>;
  }

  /**
   * Does nothing for Success since there's no error to recover from.
   * @param _f Function to recover from error (unused)
   * @returns This Success instance unchanged
   */
  recover<A1>(_f: (e: never) => A1): Result<never, A> {
    return this;
  }

  /**
   * Applies the onSuccess function to the value and returns the result.
   * @param _onFailure Function to handle failure (unused)
   * @param onSuccess Function to handle success
   * @returns Result of applying onSuccess to the value
   */
  fold<B>(_onFailure: (_: never) => B, onSuccess: (a: A) => B): B {
    return onSuccess(this.value);
  }

  /**
   * Returns the value, ignoring the default since this is a Success.
   * @param _defaultValue Default value (unused)
   * @returns The wrapped value
   */
  getOrElse<A1>(_defaultValue: A1): A {
    return this.value;
  }

  /**
   * Returns the value since this is a Success (never throws).
   * @returns The wrapped value
   */
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

  /**
   * Conditional execution based on a predicate.
   * @param predicate Function that returns true/false based on the value
   * @returns A conditional chain object for .then() and .else()
   */
  if(predicate: (a: A) => boolean): ConditionalChain<any, A> {
    return new ConditionalChain(this, predicate(this.value));
  }

  /**
   * Does nothing for Success since this is not a Failure.
   * @param _f Function to execute on failure (unused)
   * @returns This Success instance for chaining
   */
  else(_f: (e: never) => void): Success<A> {
    return this;
  }

  /**
   * Pattern matching for Elixir-style conditional execution.
   * @param patterns Array of patterns to match against
   * @returns The result of the first matching pattern
   */
  match<R>(patterns: Pattern<any, A, R>[]): R {
    for (const pattern of patterns) {
      if (isFailurePattern(pattern)) {
        // Skip failure patterns for Success
        continue;
      }

      if (isDestructuringPattern(pattern)) {
        // Pattern with destructuring: [success, object, callback]
        const [, destructure, callback] = pattern as [typeof success, object, (value: A) => R];
        if (this.matchesDestructuring(destructure)) {
          return callback(this.value);
        }
      } else if (isGuardPattern(pattern)) {
        // Pattern with guard: [success, guard, callback]
        const [, guard, callback] = pattern as [
          typeof success,
          (value: A) => boolean,
          (value: A) => R,
        ];
        if (guard(this.value)) {
          return callback(this.value);
        }
      } else if (isBasicSuccessPattern(pattern)) {
        // Basic success pattern: [success, callback]
        const [, callback] = pattern as [typeof success, (value: A) => R];
        return callback(this.value);
      }
    }

    // If no pattern matches, throw an error
    throw new Error('No matching pattern found');
  }

  /**
   * Helper method to check if the value matches a destructuring pattern.
   * @param destructure The destructuring object to match against
   * @returns true if the value matches the destructuring pattern
   */
  private matchesDestructuring(destructure: object): boolean {
    const value = this.value as any;

    for (const [key, expectedValue] of Object.entries(destructure)) {
      if (value[key] !== expectedValue) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Chain object for conditional execution with .then() and .else()
 */
class ConditionalChain<E, A> {
  constructor(
    private readonly result: Result<E, A>,
    private readonly condition: boolean,
  ) {}

  /**
   * Executes the callback if the condition was true.
   * @param callback Function to execute when condition is true
   * @returns This chain for continued chaining
   */
  then(callback: (a: A) => void): ConditionalChain<E, A> {
    if (this.condition && this.result.isSuccess()) {
      const success = this.result as Success<A>;
      callback(success.value);
    }
    return this;
  }

  /**
   * Executes the callback if the condition was false or if the Result is a Failure.
   * @param callback Function to execute when condition is false or on failure
   * @returns The original Result for continued chaining
   */
  else(callback: (a: A) => void): Result<E, A> {
    if (this.result.isSuccess()) {
      // For Success, execute if condition is false
      if (!this.condition) {
        const success = this.result as Success<A>;
        callback(success.value);
      }
    } else {
      // For Failure, always execute the callback with the error
      const failure = this.result as Failure<E>;
      callback(failure.error as any);
    }
    return this.result;
  }
}

class Failure<E> {
  readonly _tag: 'Failure' = 'Failure';
  constructor(readonly error: E) {}

  /**
   * Type guard to check if this Result is a Success.
   * @returns false, as this is always a Failure instance
   */
  isSuccess(): boolean {
    return false;
  }

  /**
   * Type guard to check if this Result is a Failure.
   * @returns true, as this is always a Failure instance
   */
  isFailure(): this is Failure<E> {
    return true;
  }

  /**
   * Does nothing for Failure since there's no value to transform.
   * @param _f Function to transform the value (unused)
   * @returns This Failure instance unchanged
   */
  map<B>(_f: (a: never) => B): Result<E, never> {
    return this as unknown as Result<E, never>;
  }

  /**
   * Does nothing for Failure since there's no value to chain with.
   * @param _f Function to chain with (unused)
   * @returns This Failure instance unchanged
   */
  flatMap<E1, B>(_f: (a: never) => Result<E1, B>): Result<E | E1, never> {
    return this as unknown as Result<E, never>;
  }

  /**
   * Transforms the error inside this Failure using the provided function.
   * @param f Function to transform the error
   * @returns A new Failure containing the transformed error
   */
  mapError<E1>(f: (e: E) => E1): Result<E1, never> {
    return failure(f(this.error));
  }

  /**
   * Recovers from this Failure by applying the function to the error.
   * @param f Function that transforms the error into a success value
   * @returns A Success containing the recovered value
   */
  recover<A>(f: (e: E) => A): Result<never, A> {
    return success(f(this.error));
  }

  /**
   * Applies the onFailure function to the error and returns the result.
   * @param onFailure Function to handle failure
   * @param _onSuccess Function to handle success (unused)
   * @returns Result of applying onFailure to the error
   */
  fold<B>(onFailure: (e: E) => B, _onSuccess: (a: never) => B): B {
    return onFailure(this.error);
  }

  /**
   * Returns the default value since this is a Failure.
   * @param defaultValue Default value to return
   * @returns The provided default value
   */
  getOrElse<A1>(defaultValue: A1): A1 {
    return defaultValue;
  }

  /**
   * Throws the wrapped error since this is a Failure.
   * @throws The wrapped error
   */
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

  /**
   * Conditional execution - always returns a chain that executes .else() for Failure.
   * @param _predicate Function that returns true/false (unused for Failure)
   * @returns A conditional chain object that always executes .else()
   */
  if(_predicate: (a: never) => boolean): ConditionalChain<E, never> {
    return new ConditionalChain(this, false);
  }

  /**
   * Does nothing for Failure since this is not a Success.
   * @param _f Function to execute on success (unused)
   * @returns This Failure instance for chaining
   */
  else(_f: (a: never) => void): Failure<E> {
    return this;
  }

  /**
   * Pattern matching for Elixir-style conditional execution.
   * For Failure, only failure patterns are executed.
   * @param patterns Array of patterns to match against
   * @returns The result of the first matching failure pattern
   */
  match<R>(patterns: Pattern<E, never, R>[]): R {
    for (const pattern of patterns) {
      if (isFailurePattern(pattern)) {
        // Execute failure pattern
        const [, callback] = pattern;
        return callback(this.error);
      }
    }

    // If no failure pattern matches, throw an error
    throw new Error('No matching failure pattern found');
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
