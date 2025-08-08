# seiken-fx

A lightweight functional programming utility library for TypeScript/JavaScript applications.

## Installation

```bash
npm install seiken-fx
# or
yarn add seiken-fx
```

## Core Concepts

This library is built around functional programming principles, with a focus on immutability, composition, and explicit error handling through the `Result` type.

### The Result Type

The core of our error handling is the `Result<E, A>` type, which represents either a successful computation (`Success<A>`) or a failure (`Failure<E>`). This approach allows for safer handling of operations that might fail.

## API

### Array Utilities

All array functions in seiken-fx use the Result type for safe, functional operations that handle errors explicitly.

```typescript
// Safe parsing function  
const safeParse = (x: string): Result<string, number> => {
  const num = parseInt(x);
  return isNaN(num) ? failure("Not a number") : success(num);
};

// Transform each element safely
const result = map(safeParse)(['1', '2', '3']);
// result is Success([1, 2, 3])

const badResult = map(safeParse)(['1', 'invalid', '3']);
// badResult is Failure("Not a number")

// Filter with safe predicates
const safeIsEven = (x: number) => success(x % 2 === 0);
const evens = filter(safeIsEven)([1, 2, 3, 4]);
// evens is Success([2, 4])

// Safe reduction
const safeSum = (acc: number, curr: number) => success(acc + curr);
const sum = reduce(safeSum, 0)([1, 2, 3, 4]);
// sum is Success(10)

// Safe array access
const first = head([1, 2, 3], () => "Empty array");
// first is Success(1)

const emptyFirst = head([], () => "Empty array");
// emptyFirst is Failure("Empty array")

// Get remaining elements
const rest = tail([1, 2, 3]);
// rest is Success([2, 3])

// Safe element access by index
const element = get(1, (i) => `Index ${i} out of bounds`)([10, 20, 30]);
// element is Success(20)

// Utility functions
const empty = isEmpty([]);
// empty is Success(true)

const len = length([1, 2, 3]);
// len is Success(3)
```

### Composition Utilities

#### Basic composition

```typescript
// Compose functions (right to left)
const add5 = (x: number) => x + 5;
const multiply2 = (x: number) => x * 2;
const subtract3 = (x: number) => x - 3;

const composed = compose(add5, multiply2, subtract3);
composed(10); // ((10 - 3) * 2) + 5 = 19

// Pipe functions (left to right)
const piped = pipe(subtract3, multiply2, add5);
piped(10); // Same result: 19

// Currying
const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1, 2, 3); // 6
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
```

#### Result-based composition

```typescript
// Functions that may fail
const parseJSON = (str: string): Result<Error, object> => 
  tryCatch(() => JSON.parse(str), e => e as Error);

const getUser = (obj: any): Result<string, { name: string }> => 
  obj && obj.name ? success({ name: obj.name }) : failure("No user found");

// Compose with error handling
const getUserFromJSON = composeResult(getUser, parseJSON);

getUserFromJSON('{"name": "John"}'); // Success({ name: "John" })
getUserFromJSON('{"age": 30}'); // Failure("No user found")
getUserFromJSON('{invalid}'); // Failure(SyntaxError: ...)

// Async composition
const fetchData = async (url: string): Promise<Result<Error, any>> => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return success(data);
  } catch (e) {
    return failure(e as Error);
  }
};

const processData = (data: any): Result<string, string> => 
  data ? success(`Processed: ${data}`) : failure("Invalid data");

const fetchAndProcess = pipeAsyncResult(fetchData, processData);
```

### Object Utilities

#### Basic object functions

```typescript
const user = { name: "John", age: 30, city: "New York" };

// Get a property
const getName = prop("name");
getName(user); // "John"

// Pick specific properties
const getNameAndCity = pick(["name", "city"]);
getNameAndCity(user); // { name: "John", city: "New York" }

// Omit properties
const withoutAge = omit(["age"]);
withoutAge(user); // { name: "John", city: "New York" }
```

#### Result-based object functions

```typescript
// Safely get a property
const getEmail = propResult("email", () => "Email not found");
getEmail(user); // Failure("Email not found")

// Safely pick properties
const safePickDetails = pickResult(["name", "email"], (key) => `${key} not found`);
safePickDetails(user); // Failure("email not found")

// Get nested properties safely
const getData = getPath(["address", "zipCode"], (path) => `${path} not found`);
getData(user); // Failure("address.zipCode not found")
```

### Result Utilities

```typescript
// Create Results
const ok = success(42); // Success wrapping 42
const err = failure("Something went wrong"); // Failure wrapping an error

// Transform values
const doubled = ok.map(x => x * 2); // Success(84)

// Chain operations
const maybeDouble = (x: number): Result<string, number> => 
  x < 0 ? failure("Cannot double negative") : success(x * 2);

const chainResult = ok.flatMap(maybeDouble); // Success(84)

// Transform errors
const prettyError = err.mapError(e => `Error occurred: ${e}`);
// Failure("Error occurred: Something went wrong")

// Recover from errors
const recovered = err.recover(e => `Default value (${e})`);
// Success("Default value (Something went wrong)")

// Pattern matching with fold
const message = ok.fold(
  e => `Error: ${e}`,
  value => `Value is ${value}`
); // "Value is 42"

// Try operations that might throw
const jsonResult = tryCatch(
  () => JSON.parse('{"name": "John"}'),
  err => new Error(`Parse failed: ${err}`)
); // Success({name: "John"})

// Work with Promises
const asyncResult = await fromPromise(
  fetch('https://api.example.com/data'),
  err => new Error(`Network error: ${err}`)
);

// Combine multiple Results
const results = [success(1), success(2), success(3)];
const combined = all(results); // Success([1, 2, 3])

const withFailure = [success(1), failure("Oops"), success(3)];
const failedCombine = all(withFailure); // Failure("Oops")
```

## Practical Examples

### Form Validation

```typescript
const validateEmail = (email: string): Result<string, string> =>
  /^\S+@\S+\.\S+$/.test(email) 
    ? success(email) 
    : failure("Invalid email format");

const validatePassword = (password: string): Result<string, string> =>
  password.length >= 8
    ? success(password)
    : failure("Password must be at least 8 characters");

const validateForm = (form: { email: string, password: string }) =>
  validateEmail(form.email)
    .flatMap(email => 
      validatePassword(form.password)
        .map(password => ({ email, password }))
    );

// Usage
const validForm = validateForm({ 
  email: "user@example.com", 
  password: "securepass" 
}); // Success({email: "user@example.com", password: "securepass"})

const invalidForm = validateForm({ 
  email: "invalid", 
  password: "short" 
}); // Failure("Invalid email format")
```

### Data Processing Pipeline

```typescript
const fetchUserData = async (id: string): Promise<Result<Error, any>> => {
  // Imagine this fetches data from an API
  return success({ id, name: "John Doe", active: true });
};

const validateUser = (user: any): Result<string, any> =>
  user.active ? success(user) : failure("User is not active");

const formatUser = (user: any): Result<never, string> =>
  success(`${user.name} (${user.id})`);

const processUser = pipeAsyncResult(
  fetchUserData,
  validateUser,
  formatUser
);

// Usage
const result = await processUser("user123");
result.fold(
  err => console.error("Failed to process user:", err),
  formatted => console.log("Formatted user:", formatted)
);
```

## License

MIT
