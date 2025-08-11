# seiken-fx

[![CI](https://github.com/camisetags/seiken-fx/workflows/CI/badge.svg)](https://github.com/camisetags/seiken-fx/actions)
[![npm version](https://badge.fury.io/js/seiken-fx.svg)](https://badge.fury.io/js/seiken-fx)
[![codecov](https://codecov.io/gh/camisetags/seiken-fx/branch/main/graph/badge.svg)](https://codecov.io/gh/camisetags/seiken-fx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive functional programming utility library for TypeScript/JavaScript with a **Result-first philosophy**. Built for type safety, explicit error handling, and functional composition patterns.

## ✨ Features

- 🛡️ **Result-first design** - All operations use `Result<E, A>` for explicit error handling
- 🧮 **Comprehensive utilities** - Array, Object, and Function composition tools
- 🔧 **Type-safe** - Full TypeScript support with strict type inference
- 📦 **Tree-shakeable** - Import only what you need
- 🎯 **Zero dependencies** - Lightweight and focused
- 🧪 **100% tested** - Comprehensive test coverage (98%+)
- 🔄 **Elixir-style destructuring** - Familiar patterns for error handling

## 📦 Installation

```bash
npm install seiken-fx
# or
yarn add seiken-fx
# or  
pnpm add seiken-fx
```

## 🚀 Quick Start

```typescript
import { success, failure, map, prop, compose } from 'seiken-fx';

// Result-based operations
const safeParse = (x: string) => {
  const num = parseInt(x);
  return isNaN(num) ? failure("Not a number") : success(num);
};

// Transform arrays safely
const numbers = map(safeParse)(['1', '2', '3']);
// Success([1, 2, 3])

// Extract object properties safely  
const getName = prop('name', () => 'Name not found');
getName({ name: 'John' }); // Success('John')

// Compose operations
const processUser = compose(
  getName,
  user => success(user.toLowerCase())
);
```

## 📚 Core Concepts

### The Result Type

The foundation of seiken-fx is the `Result<E, A>` type, representing either:
- `Success<A>` - A successful computation with value of type `A`
- `Failure<E>` - A failed computation with error of type `E`

This approach eliminates runtime exceptions and makes error handling explicit and type-safe.

```typescript
// Creating Results
const ok = success(42);           // Success<number>
const err = failure("Oops");      // Failure<string>

// Pattern matching
const message = ok.fold(
  error => `Error: ${error}`,
  value => `Value: ${value}`
); // "Value: 42"

// Elixir-style destructuring
const [value, error] = ok.unwrap();
// value = 42, error = null
```

## 📖 API Reference

### 🔥 Result Utilities

#### Core Result Functions

```typescript
import { success, failure, tryCatch, fromPromise, all } from 'seiken-fx';

// Create Results
const ok = success(42);
const err = failure("Something went wrong");

// Safe exception handling
const jsonResult = tryCatch(
  () => JSON.parse('{"valid": true}'),
  err => new Error(`Parse failed: ${err}`)
);

// Promise integration
const apiResult = await fromPromise(
  fetch('/api/data'),
  err => new Error(`Network error: ${err}`)
);

// Elixir-style Promise handling (returns tuple directly)
const [data, error] = await fromPromiseTuple(fetch('/api/data'));
if (error) {
  console.error('Request failed:', error);
} else {
  console.log('Data:', data);
}

// Combine multiple Results
const combined = all([success(1), success(2), success(3)]);
// Success([1, 2, 3])
```

#### Result Methods

```typescript
// Transform success values
result.map(x => x * 2);

// Transform error values  
result.mapError(err => `Failed: ${err}`);

// Chain operations that return Results
result.flatMap(x => x > 0 ? success(x) : failure("Negative"));

// Recover from failures
result.recover(err => `Default: ${err}`);

// Check status
result.isSuccess(); // boolean
result.isFailure(); // boolean

// Pattern matching
result.fold(
  error => handleError(error),
  value => handleSuccess(value)
);

// Destructure to tuple [value, error]
const [value, error] = result.unwrap();
```

### 📊 Array Utilities

All array functions return `Result` types for safe operations:

```typescript
import { map, filter, reduce, head, tail, get, isEmpty, length } from 'seiken-fx';

// Transform elements
const doubled = map((x: number) => success(x * 2))([1, 2, 3]);
// Success([2, 4, 6])

// Filter with safe predicates
const evens = filter((x: number) => success(x % 2 === 0))([1, 2, 3, 4]);
// Success([2, 4])

// Reduce safely
const sum = reduce((acc: number, curr: number) => success(acc + curr), 0)([1, 2, 3]);
// Success(6)

// Safe array access
const first = head([1, 2, 3], () => "Empty array");
// Success(1)

const rest = tail([1, 2, 3]);
// Success([2, 3])

const element = get(1, (i) => `Index ${i} out of bounds`)([10, 20, 30]);
// Success(20)

// Utility functions
const empty = isEmpty([]);  // Success(true)
const len = length([1, 2, 3]);  // Success(3)
```

### 🎯 Object Utilities

Comprehensive object manipulation with Result-based error handling:

#### Basic Object Operations

```typescript
import { prop, pick, omit, getPath } from 'seiken-fx';

const user = { name: 'John', age: 30, city: 'NYC' };

// Extract properties safely
const getName = prop('name', () => 'Name not found');
getName(user); // Success('John')

// Pick multiple properties
const getDetails = pick(['name', 'city'], (key) => `Missing: ${key}`);
getDetails(user); // Success({ name: 'John', city: 'NYC' })

// Omit properties
const withoutAge = omit(['age']);
withoutAge(user); // Success({ name: 'John', city: 'NYC' })

// Access nested properties
const getNestedValue = getPath(['profile', 'settings', 'theme'], (path) => `Path not found: ${path}`);
```

#### Advanced Object Operations

```typescript
import { 
  mapValues, has, filterValues, compact, isObjectEmpty,
  merge, defaults, keys, values, entries, clone 
} from 'seiken-fx';

// Transform object values
const doubled = mapValues(
  (value: number) => success(value * 2),
  (error, key) => `Error at ${key}: ${error}`
)({ a: 1, b: 2 });
// Success({ a: 2, b: 4 })

// Check property existence
const hasName = has('name');
hasName(user); // Success(true)

// Filter by values
const adults = filterValues(
  (age: number) => success(age >= 18),
  (error, key) => `Invalid age at ${key}`
)({ john: 25, jane: 17, bob: 30 });
// Success({ john: 25, bob: 30 })

// Remove null/undefined values
const cleaned = compact()({ a: 1, b: null, c: undefined, d: 'hello' });
// Success({ a: 1, d: 'hello' })

// Check if object is empty
const empty = isObjectEmpty()({});
// Success(true)

// Merge objects with conflict resolution
const merged = merge((key, target, source) => success(`${target}-${source}`))
  ({ a: 'first' }, { a: 'second', b: 'new' });
// Success({ a: 'first-second', b: 'new' })

// Apply defaults
const withDefaults = defaults({ theme: 'light', lang: 'en' });
withDefaults({ theme: 'dark' }); // Success({ theme: 'dark', lang: 'en' })

// Object introspection
const objKeys = keys()({ a: 1, b: 2 });     // Success(['a', 'b'])
const objValues = values()({ a: 1, b: 2 }); // Success([1, 2])
const objEntries = entries()({ a: 1, b: 2 }); // Success([['a', 1], ['b', 2]])
```

#### Deep Cloning with Protection

```typescript
import { clone } from 'seiken-fx';

// Safe deep cloning with depth protection
const cloneObj = clone(
  { maxDepth: 10, cloneFunctions: false }, 
  (depth) => `Max depth ${depth} exceeded`
);

const original = { user: { profile: { name: 'John' } } };
const result = cloneObj(original);
// Success({ user: { profile: { name: 'John' } } })

// Protection against deeply nested objects
const tooDeep = clone({ maxDepth: 2 }, (depth) => `Too deep: ${depth}`);
const deepObj = { a: { b: { c: { d: 'value' } } } };
tooDeep(deepObj); // Failure("Too deep: 3")
```

### 🔄 Function Composition

```typescript
import { curry, compose, pipe, composeAsync, pipeAsync } from 'seiken-fx';

// Currying
const add = (a: number, b: number, c: number) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6

// Sync composition (right-to-left)
const processText = compose(
  (text: string) => success(text.toUpperCase()),
  (text: string) => success(text.trim()),
  (text: string) => text.length > 0 ? success(text) : failure("Empty text")
);

processText("  hello  "); // Success("HELLO")

// Sync pipeline (left-to-right)  
const pipeline = pipe(
  (text: string) => text.length > 0 ? success(text) : failure("Empty text"),
  (text: string) => success(text.trim()),
  (text: string) => success(text.toUpperCase())
);

// Async composition
const fetchUser = async (id: string) => {
  const response = await fetch(`/users/${id}`);
  return success(await response.json());
};

const validateUser = (user: any) => 
  user.active ? success(user) : failure("User inactive");

const formatUser = (user: any) => 
  success(`${user.name} (${user.id})`);

const processUser = pipeAsync(fetchUser, validateUser, formatUser);

const result = await processUser("123");
// Success("John Doe (123)") or Failure(...)
```

## 🏗️ Practical Examples

### Form Validation

```typescript
import { success, failure } from 'seiken-fx';

const validateEmail = (email: string) =>
  /^\S+@\S+\.\S+$/.test(email) 
    ? success(email) 
    : failure("Invalid email format");

const validatePassword = (password: string) =>
  password.length >= 8
    ? success(password)
    : failure("Password too short");

const validateForm = (form: { email: string; password: string }) =>
  validateEmail(form.email).flatMap(email =>
    validatePassword(form.password).map(password => ({ email, password }))
  );

// Usage
const result = validateForm({ 
  email: "user@example.com", 
  password: "securepass123" 
});

result.fold(
  error => console.error("Validation failed:", error),
  data => console.log("Valid form:", data)
);
```

### API Data Processing

```typescript
import { fromPromiseTuple, compose, prop } from 'seiken-fx';

// Fetch and process user data
const processUserData = async (userId: string) => {
  // Fetch data with Elixir-style error handling
  const [userData, fetchError] = await fromPromiseTuple(
    fetch(`/api/users/${userId}`)
  );
  
  if (fetchError) {
    return failure(`Failed to fetch user: ${fetchError.message}`);
  }

  // Process the data
  const extractName = prop('name', () => 'Name not found');
  const formatName = (name: string) => success(`User: ${name.toUpperCase()}`);
  
  const processName = compose(formatName, extractName);
  
  return processName(userData);
};

// Usage
const result = await processUserData("123");
const [formattedName, error] = result.unwrap();

if (error) {
  console.error("Processing failed:", error);
} else {
  console.log("Result:", formattedName); // "User: JOHN DOE"
}
```

### Data Pipeline with Error Recovery

```typescript
import { pipe, map, filter } from 'seiken-fx';

const processNumbers = pipe(
  // Parse strings to numbers
  map((str: string) => {
    const num = parseInt(str);
    return isNaN(num) ? failure(`Invalid number: ${str}`) : success(num);
  }),
  
  // Filter positive numbers (recover from previous errors)
  (result) => result.recover(() => []).flatMap(
    filter((num: number) => success(num > 0))
  ),
  
  // Double the numbers
  (result) => result.flatMap(
    map((num: number) => success(num * 2))
  )
);

const result = processNumbers(['1', '2', 'invalid', '4']);
result.fold(
  error => console.error("Pipeline failed:", error),
  numbers => console.log("Processed numbers:", numbers) // [2, 4, 8]
);
```

## 🧪 Testing Support

Seiken-fx provides excellent testing utilities with its explicit error handling:

```typescript
import { success, failure } from 'seiken-fx';

// Easy testing with pattern matching
const result = someOperation();

// Test success cases
expect(result.isSuccess()).toBe(true);
const [value, error] = result.unwrap();
expect(value).toBe(expectedValue);
expect(error).toBeNull();

// Test failure cases  
expect(result.isFailure()).toBe(true);
const [value2, error2] = result.unwrap();
expect(value2).toBeNull();
expect(error2).toBe(expectedError);

// Test with fold
result.fold(
  error => expect(error).toBe(expectedError),
  value => expect(value).toBe(expectedValue)
);
```

## 🔧 TypeScript Configuration

For the best experience, use these TypeScript compiler options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our development process.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Libraries

- [fp-ts](https://github.com/gcanti/fp-ts) - More comprehensive FP library
- [Ramda](https://ramdajs.com/) - Practical functional library
- [Lodash/FP](https://github.com/lodash/lodash/wiki/FP-Guide) - Functional programming flavor of Lodash

---

**Built with ❤️ for the functional programming community**
