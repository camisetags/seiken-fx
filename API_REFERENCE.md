# API Reference - seiken-fx

Complete reference for all functions and utilities in seiken-fx.

## 📋 Table of Contents

- [Result Core](#result-core)
- [Result Methods](#result-methods) 
- [Array Utilities](#array-utilities)
- [Object Utilities](#object-utilities)
- [Function Composition](#function-composition)
- [Promise Integration](#promise-integration)
- [Type Definitions](#type-definitions)
- [Usage Patterns](#usage-patterns)

---

## 🔥 Result Core

### `success<A>(value: A): Success<A>`
Creates a successful Result containing the given value.

```typescript
const result = success(42);
// Success(42)
```

### `failure<E>(error: E): Failure<E>`
Creates a failed Result containing the given error.

```typescript
const result = failure("Something went wrong");
// Failure("Something went wrong")
```

### `tryCatch<E, A>(fn: () => A, onError: (error: unknown) => E): Result<E, A>`
Safely executes a function that might throw, converting exceptions to Results.

```typescript
const parseJson = tryCatch(
  () => JSON.parse('{"valid": true}'),
  err => `Parse error: ${err}`
);
// Success({valid: true})

const badParse = tryCatch(
  () => JSON.parse('invalid json'),
  err => `Parse error: ${err}`
);
// Failure("Parse error: SyntaxError: ...")
```

### `all<E, A>(results: Result<E, A>[]): Result<E, A[]>`
Combines multiple Results into a single Result containing an array of values.
If any Result is a failure, returns the first failure.

```typescript
const combined = all([success(1), success(2), success(3)]);
// Success([1, 2, 3])

const withFailure = all([success(1), failure("error"), success(3)]);
// Failure("error")
```

---

## 🔧 Result Methods

### `.map<B>(f: (a: A) => B): Result<E, B>`
Transforms the success value using the provided function.

```typescript
success(10).map(x => x * 2);
// Success(20)

failure("error").map(x => x * 2);
// Failure("error") - unchanged
```

### `.flatMap<E2, B>(f: (a: A) => Result<E2, B>): Result<E | E2, B>`
Chains operations that return Results (monadic bind).

```typescript
success(10)
  .flatMap(x => x > 5 ? success(x * 2) : failure("too small"));
// Success(20)

success(3)
  .flatMap(x => x > 5 ? success(x * 2) : failure("too small"));
// Failure("too small")
```

### `.mapError<E2>(f: (e: E) => E2): Result<E2, A>`
Transforms the error value while leaving success unchanged.

```typescript
failure("network error").mapError(err => `HTTP: ${err}`);
// Failure("HTTP: network error")

success(42).mapError(err => `HTTP: ${err}`);
// Success(42) - unchanged
```

### `.recover<A2>(f: (e: E) => A2): Result<never, A | A2>`
Recovers from failure by providing a default value.

```typescript
failure("error").recover(err => `Default: ${err}`);
// Success("Default: error")

success(42).recover(err => 0);
// Success(42) - unchanged
```

### `.fold<B>(onFailure: (e: E) => B, onSuccess: (a: A) => B): B`
Pattern matching - executes one function based on Result state.

```typescript
const message = result.fold(
  error => `Error: ${error}`,
  value => `Success: ${value}`
);
```

### `.getOrElse<A2>(defaultValue: A2): A | A2`
Returns the success value or the provided default.

```typescript
success(42).getOrElse(0); // 42
failure("error").getOrElse(0); // 0
```

### `.getOrThrow(): A`
Returns the success value or throws the error.

```typescript
success(42).getOrThrow(); // 42
failure("error").getOrThrow(); // throws "error"
```

### `.unwrap(): [A | null, E | null]`
Destructures Result into Elixir-style tuple `[value, error]`.

```typescript
const [value, error] = success(42).unwrap();
// value = 42, error = null

const [value2, error2] = failure("oops").unwrap();
// value2 = null, error2 = "oops"
```

### `.if(predicate: (a: A) => boolean): ConditionalChain<E, A>`
Conditional execution based on a predicate. Returns a chain object for `.then()` and `.else()`.

```typescript
success(15).if(value => value > 10)
  .then(value => console.log(`${value} is large`))
  .else(value => console.log(`${value} is small`));
// Logs: "15 is large"

failure("error").if(value => value.length > 0)
  .then(value => console.log(`Success: ${value}`))
  .else(error => console.log(`Error: ${error}`));
// Logs: "Error: error" (always executes .else for Failure)
```

### `.then(callback: (a: A) => void): ConditionalChain<E, A>`
Executes the callback if the condition from `.if()` was true. Returns the chain for continued chaining.

### `.else(callback: (a: A) => void): Result<E, A>`
Executes the callback if the condition from `.if()` was false, or if the Result is a Failure. Returns the original Result for continued chaining.

### `.match<R>(patterns: MatchPattern<E, A, R>[]): Result<any, R>`
Elixir-style pattern matching with guards and destructuring. Executes the first matching pattern.

```typescript
// Basic pattern matching
result.match([
  [success, (value: number) => `Number: ${value}`],
  [failure, (error: string) => `Error: ${error}`]
]);

// Pattern matching with guards
result.match([
  [success, (value: number) => value > 10, (value: number) => `Large: ${value}`],
  [success, (value: number) => value <= 10, (value: number) => `Small: ${value}`],
  [failure, (error: string) => `Failed: ${error}`]
]);

// Complex destructuring patterns
userResult.match([
  [success, { role: 'admin' }, (user: any) => `Admin: ${user.name}`],
  [success, { role: 'user' }, (user: any) => `User: ${user.name}`],
  [failure, (error: string) => `Error: ${error}`]
]);
```

### `.try<B>(operation: (value: A) => B): TryChain<E, A, B>`
Executes an operation that might throw, returning a TryChain for error handling.

```typescript
success("42").try(parseInt)
  .catch(error => `Parse failed: ${error}`)
  .map(value => value * 2);
// Success(84)

success("invalid").try(parseInt)
  .catch(error => `Parse failed: ${error}`)
  .map(value => value * 2);
// Failure("Parse failed: NaN")
```

### `.catch<F>(errorHandler: (error: unknown) => F): Result<F, B>`
Handles errors from the `.try()` operation. Must be called after `.try()`.

```typescript
// Always returns a Result for continued chaining
result.try(riskyOperation)
  .catch(error => `Handled: ${error}`)
  .map(value => processValue(value));
```

### `.finally(cleanup: () => void): TryChain<E, A, B>`
Executes cleanup code and returns the TryChain for continued error handling.

```typescript
result.try(riskyOperation)
  .finally(() => console.log('Cleanup executed'))
  .catch(error => `Handled: ${error}`);
```

### `.isSuccess(): boolean`
Type guard to check if Result is Success.

### `.isFailure(): boolean`
Type guard to check if Result is Failure.

---

## 📊 Array Utilities

### `map<T, U, E>(fn: (x: T) => Result<E, U>): (arr: readonly T[]) => Result<E, readonly U[]>`
Transforms array elements with a Result-returning function.

```typescript
const parseNumbers = map((str: string) => {
  const num = parseInt(str);
  return isNaN(num) ? failure(`Invalid: ${str}`) : success(num);
});

parseNumbers(['1', '2', '3']); // Success([1, 2, 3])
parseNumbers(['1', 'bad', '3']); // Failure("Invalid: bad")
```

### `filter<T, E>(predicate: (x: T) => Result<E, boolean>): (arr: readonly T[]) => Result<E, readonly T[]>`
Filters array elements with a Result-returning predicate.

```typescript
const filterPositive = filter((x: number) => success(x > 0));
filterPositive([1, -2, 3, -4]); // Success([1, 3])
```

### `reduce<T, U, E>(fn: (acc: U, curr: T) => Result<E, U>, initial: U): (arr: readonly T[]) => Result<E, U>`
Reduces array with a Result-returning accumulator function.

```typescript
const sum = reduce((acc: number, curr: number) => success(acc + curr), 0);
sum([1, 2, 3, 4]); // Success(10)
```

### `head<T, E>(arr: readonly T[], onEmpty: () => E): Result<E, T>`
Gets the first element of an array safely.

```typescript
head([1, 2, 3], () => "Empty array"); // Success(1)
head([], () => "Empty array"); // Failure("Empty array")
```

### `tail<T>(arr: readonly T[]): Result<string, readonly T[]>`
Gets all elements except the first.

```typescript
tail([1, 2, 3]); // Success([2, 3])
tail([1]); // Success([])
tail([]); // Failure("Cannot get tail of empty array")
```

### `get<T, E>(index: number, onError: (index: number) => E): (arr: readonly T[]) => Result<E, T>`
Gets element at index safely.

```typescript
const getAt1 = get(1, i => `Index ${i} out of bounds`);
getAt1([10, 20, 30]); // Success(20)
getAt1([10]); // Failure("Index 1 out of bounds")
```

### `isEmpty<T>(arr: readonly T[]): Result<never, boolean>`
Checks if array is empty.

```typescript
isEmpty([]); // Success(true)
isEmpty([1, 2]); // Success(false)
```

### `length<T>(arr: readonly T[]): Result<never, number>`
Gets array length safely.

```typescript
length([1, 2, 3]); // Success(3)
```

---

## 🎯 Object Utilities

### `prop<T, K extends keyof T, E>(key: K, onError: () => E): (obj: T) => Result<E, T[K]>`
Extracts property from object safely.

```typescript
const getName = prop('name', () => 'Name not found');
getName({name: 'John', age: 30}); // Success('John')
getName({age: 30}); // Failure('Name not found')
```

### `pick<T, K extends keyof T, E>(keys: readonly K[], onError: (key: K) => E): (obj: T) => Result<E, Pick<T, K>>`
Picks multiple properties from object.

```typescript
const getProfile = pick(['name', 'email'], key => `Missing: ${key}`);
getProfile({name: 'John', email: 'john@test.com', age: 30});
// Success({name: 'John', email: 'john@test.com'})
```

### `omit<T, K extends keyof T>(keys: readonly K[]): (obj: T) => Result<never, Omit<T, K>>`
Omits specified properties from object.

```typescript
const withoutAge = omit(['age']);
withoutAge({name: 'John', age: 30}); // Success({name: 'John'})
```

### `getPath<T, E>(path: readonly string[], onError: (path: readonly string[]) => E): (obj: T) => Result<E, unknown>`
Gets nested property by path.

```typescript
const getNestedValue = getPath(['user', 'profile', 'name'], path => `Path not found: ${path.join('.')}`);
getNestedValue({user: {profile: {name: 'John'}}}); // Success('John')
```

### `mapValues<T, U, E>(fn: (value: T[keyof T]) => Result<E, U>, onError: (error: E, key: string) => E): (obj: T) => Result<E, Record<keyof T, U>>`
Transforms all values in an object.

```typescript
const doubleValues = mapValues(
  (value: number) => success(value * 2),
  (error, key) => `Error at ${key}: ${error}`
);
doubleValues({a: 1, b: 2}); // Success({a: 2, b: 4})
```

### `has<T>(key: keyof T): (obj: T) => Result<never, boolean>`
Checks if object has property.

```typescript
const hasName = has('name');
hasName({name: 'John'}); // Success(true)
hasName({age: 30}); // Success(false)
```

### `filterValues<T, E>(predicate: (value: T[keyof T]) => Result<E, boolean>, onError: (error: E, key: string) => E): (obj: T) => Result<E, Partial<T>>`
Filters object by values.

```typescript
const filterAdults = filterValues(
  (age: number) => success(age >= 18),
  (error, key) => `Invalid age at ${key}`
);
filterAdults({john: 25, jane: 17, bob: 30}); // Success({john: 25, bob: 30})
```

### `compact<T>(): (obj: T) => Result<never, CompactObject<T>>`
Removes null/undefined values from object.

```typescript
compact()({a: 1, b: null, c: undefined, d: 'hello'});
// Success({a: 1, d: 'hello'})
```

### `isObjectEmpty<T>(): (obj: T) => Result<never, boolean>`
Checks if object is empty.

```typescript
isObjectEmpty()({}); // Success(true)
isObjectEmpty()({a: 1}); // Success(false)
```

### `merge<T, U, E>(resolver: (key: string, target: unknown, source: unknown) => Result<E, unknown>): (target: T, source: U) => Result<E, T & U>`
Merges objects with conflict resolution.

```typescript
const merger = merge((key, target, source) => success(`${target}-${source}`));
merger({a: 'first'}, {a: 'second', b: 'new'});
// Success({a: 'first-second', b: 'new'})
```

### `defaults<T, U>(defaultValues: U): (obj: T) => Result<never, T & U>`
Applies default values to object.

```typescript
const withDefaults = defaults({theme: 'light', lang: 'en'});
withDefaults({theme: 'dark'}); // Success({theme: 'dark', lang: 'en'})
```

### `keys<T>(): (obj: T) => Result<never, (keyof T)[]>`
Gets object keys safely.

```typescript
keys()({a: 1, b: 2}); // Success(['a', 'b'])
```

### `values<T>(): (obj: T) => Result<never, T[keyof T][]>`
Gets object values safely.

```typescript
values()({a: 1, b: 2}); // Success([1, 2])
```

### `entries<T>(): (obj: T) => Result<never, [keyof T, T[keyof T]][]>`
Gets object entries safely.

```typescript
entries()({a: 1, b: 2}); // Success([['a', 1], ['b', 2]])
```

### `clone<T, E>(options: {maxDepth?: number; cloneFunctions?: boolean}, onError: (depth: number) => E): (obj: T) => Result<E, T>`
Deep clones object with protection against infinite recursion.

```typescript
const cloner = clone({maxDepth: 10, cloneFunctions: false}, depth => `Max depth ${depth} exceeded`);
cloner({a: {b: {c: 'deep'}}}); // Success({a: {b: {c: 'deep'}}})
```

---

## 🔄 Function Composition

### `curry<T extends readonly unknown[], R>(fn: (...args: T) => R): CurriedFunction<T, R>`
Converts function to curried form.

```typescript
const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
```

### `compose<T>(...fns: ComposableFunction<T>[]): ComposableFunction<T>`
Composes functions right-to-left.

```typescript
const processText = compose(
  (text: string) => success(text.toUpperCase()),
  (text: string) => success(text.trim())
);
processText("  hello  "); // Success("HELLO")
```

### `pipe<T>(...fns: ComposableFunction<T>[]): ComposableFunction<T>`
Composes functions left-to-right.

```typescript
const pipeline = pipe(
  (text: string) => success(text.trim()),
  (text: string) => success(text.toUpperCase())
);
pipeline("  hello  "); // Success("HELLO")
```

### `composeAsync<T>(...fns: AsyncComposableFunction<T>[]): AsyncComposableFunction<T>`
Composes async functions right-to-left.

```typescript
const processUser = composeAsync(
  async (user: User) => success(formatUser(user)),
  async (user: User) => validateUser(user),
  async (id: string) => fetchUser(id)
);
```

### `pipeAsync<T>(...fns: AsyncComposableFunction<T>[]): AsyncComposableFunction<T>`
Composes async functions left-to-right.

```typescript
const pipeline = pipeAsync(
  async (id: string) => fetchUser(id),
  async (user: User) => validateUser(user),
  async (user: User) => success(formatUser(user))
);
```

---

## 🌐 Promise Integration

### `fromPromise<E, A>(promise: Promise<A>, onError: (error: unknown) => E): Promise<Result<E, A>>`
Converts Promise to Promise of Result.

```typescript
const result = await fromPromise(
  fetch('/api/data'),
  err => `Network error: ${err}`
);
// Success(Response) or Failure("Network error: ...")
```

### `fromPromiseTuple<A>(promise: Promise<A>): Promise<[A | null, Error | null]>`
Converts Promise to Elixir-style tuple.

```typescript
const [data, error] = await fromPromiseTuple(fetch('/api/data'));
if (error) {
  console.error('Request failed:', error);
} else {
  console.log('Data:', data);
}
```

---

## 📝 Type Definitions

### `Result<E, A>`
```typescript
type Result<E, A> = Success<A> | Failure<E>
```

### `ConditionalChain<E, A>`
Chain object for conditional execution with `.if().then().else()`.

```typescript
class ConditionalChain<E, A> {
  then(callback: (a: A) => void): ConditionalChain<E, A>;
  else(callback: (a: A) => void): Result<E, A>;
}
```

### `TryChain<E, A, B>`
Chain object for error handling with `.try().catch()`.

```typescript
class TryChain<E, A, B> {
  catch<F>(errorHandler: (error: unknown) => F): Result<F, B>;
  finally(cleanup: () => void): TryChain<E, A, B>;
}
```

### `Success<A>`
```typescript
class Success<A> {
  readonly _tag: 'Success';
  readonly value: A;
  // ... methods
}
```

### `Failure<E>`
```typescript
class Failure<E> {
  readonly _tag: 'Failure';
  readonly error: E;
  // ... methods
}
```

### `ComposableFunction<T>`
```typescript
type ComposableFunction<T> = (input: T) => Result<unknown, T>
```

### `AsyncComposableFunction<T>`
```typescript
type AsyncComposableFunction<T> = (input: T) => Promise<Result<unknown, T>>
```

### `CompactObject<T>`
```typescript
type CompactObject<T> = {
  [K in keyof T]: T[K] extends null | undefined ? never : T[K]
}
```

---

## 🎯 Usage Patterns

### Error Handling Chain
```typescript
const pipeline = (input: string) =>
  tryCatch(() => JSON.parse(input), () => "Invalid JSON")
    .flatMap(data => validateData(data))
    .flatMap(validData => transformData(validData))
    .fold(
      error => console.error("Pipeline failed:", error),
      result => console.log("Success:", result)
    );
```

### Safe Property Access
```typescript
const getUserEmail = (user: unknown) =>
  getPath(['profile', 'contact', 'email'], () => "Email not found")(user);
```

### Array Processing
```typescript
const processNumbers = (strings: string[]) =>
  map((str: string) => {
    const num = parseInt(str);
    return isNaN(num) ? failure(`Invalid: ${str}`) : success(num);
  })(strings)
  .flatMap(filter((num: number) => success(num > 0)))
  .flatMap(map((num: number) => success(num * 2)));
```

### Async Operations
```typescript
const fetchAndProcessUser = async (id: string) => {
  const userResult = await fromPromise(
    fetch(`/api/users/${id}`).then(r => r.json()),
    err => `Fetch failed: ${err}`
  );
  
  return userResult
    .flatMap(validateUser)
    .map(formatUser);
};
```

### Conditional Processing
```typescript
const processUser = (user: any) =>
  success(user)
    .if(u => u.role === 'admin')
    .then(u => ({ ...u, permissions: ['read', 'write', 'delete'] }))
    .else(u => ({ ...u, permissions: ['read'] }))
    .map(u => logUserAccess(u));
```

### Pattern Matching
```typescript
const categorizeUser = (user: any) =>
  success(user).match([
    [success, { role: 'admin' }, (u: any) => `Admin: ${u.name}`],
    [success, { role: 'user' }, (u: any) => `User: ${u.name}`],
    [failure, (error: string) => `Error: ${error}`]
  ]);
```

### Error Handling with .try().catch()
```typescript
const safeParseAndProcess = (input: string) =>
  success(input)
    .try(parseInt)
    .catch(error => `Parse failed: ${error}`)
    .map(value => value * 2)
    .flatMap(value => value > 0 ? success(value) : failure("Negative result"));
```

---

For more examples and patterns, see the main [README](README.md).
