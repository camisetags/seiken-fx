# seiken-fx

[![CI](https://github.com/camisetags/seiken-fx/workflows/CI/badge.svg)](https://github.com/camisetags/seiken-fx/actions)
[![npm version](https://badge.fury.io/js/seiken-fx.svg)](https://badge.fury.io/js/seiken-fx)
[![codecov](https://codecov.io/gh/camisetags/seiken-fx/branch/main/graph/badge.svg)](https://codecov.io/gh/camisetags/seiken-fx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Tired of `try/catch` hell and unpredictable errors?** 🤔

seiken-fx is a TypeScript-first functional programming library that makes **error handling predictable, composable, and type-safe**. No more runtime surprises – every operation tells you exactly what can go wrong.

**🚀 Version 0.5.0** - Now with **Conditional Execution** and **Result-based Pattern Matching**!

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

---

## 🚨 The Problem We Solve

### Before: Unpredictable Error Handling

```typescript
// 😰 What could go wrong here?
function processUserData(userData: any) {
  const user = JSON.parse(userData);          // Might throw
  const name = user.profile.name.toUpperCase(); // Might throw  
  const age = parseInt(user.age);             // Might return NaN
  return { name, age };                       // You never know what you'll get
}

// 💥 Runtime surprises waiting to happen
try {
  const result = processUserData(someInput);
  console.log(result.name); // Did it work? Who knows!
} catch (error) {
  // What kind of error? Where did it come from?
  console.error("Something failed:", error);
}
```

### After: Predictable, Composable Operations

```typescript
// ✅ Crystal clear what can succeed or fail
function processUserData(userData: string): Result<string, { name: string; age: number }> {
  return tryCatch(() => JSON.parse(userData), () => "Invalid JSON")
    .flatMap(user => getPath(['profile', 'name'], () => "Missing name")(user))
    .flatMap(name => success(name.toUpperCase()))
    .flatMap(name => {
      const ageResult = safeParse(user.age);
      return ageResult.map(age => ({ name, age }));
    });
}

// 🎯 You know exactly what you're getting
const result = processUserData(someInput);
const [data, error] = result.unwrap();

if (error) {
  console.error("Failed:", error); // Specific, helpful error message
} else {
  console.log(data.name); // Guaranteed to exist and be correct type
}
```

---

## 🧠 Core Concept: The Result Type

Instead of throwing exceptions, every operation returns a `Result<Error, Value>` that explicitly represents success or failure:

```typescript
type Result<E, A> = Success<A> | Failure<E>
```

### Think of it as a "box" that contains either:
- ✅ **Success**: Your data + confirmation it worked
- ❌ **Failure**: Error info + guarantee nothing broke

```typescript
// Creating Results
const success = success(42);           // ✅ "Box with 42 inside"
const failure = failure("Not found");  // ❌ "Box with error inside"

// You can safely peek inside without explosions
if (result.isSuccess()) {
  console.log(result.value); // TypeScript knows this is safe
} else {
  console.log(result.error); // TypeScript knows this exists
}
```

---

## 🔄 Why This Approach? (Monadic Patterns)

### 1. **Composition Without Fear**
Chain operations knowing they'll stop safely at the first error:

```typescript
// Old way: Nested try/catch nightmare
try {
  const parsed = JSON.parse(data);
  try {
    const validated = validateUser(parsed);
    try {
      const transformed = transformUser(validated);
      return transformed;
    } catch (e3) { /* handle transform error */ }
  } catch (e2) { /* handle validation error */ }
} catch (e1) { /* handle parse error */ }

// New way: Clean composition
return tryCatch(() => JSON.parse(data), () => "Parse failed")
  .flatMap(validateUser)
  .flatMap(transformUser);
  // Automatically stops at first failure! 🎉
```

### 2. **Type Safety Guarantees**
TypeScript prevents you from accessing data that might not exist:

```typescript
const result = getUser(id);

// ❌ Compiler error - might not have value
console.log(result.value); 

// ✅ Safe access patterns
console.log(result.getOrElse("No user"));
result.map(user => console.log(user.name));
```

### 3. **No More Silent Failures**
Every operation forces you to handle both success and failure:

```typescript
// ❌ Old way: Silent failures
const age = parseInt(userInput); // Returns NaN, continues running
if (age > 18) { /* Wrong! age might be NaN */ }

// ✅ New way: Explicit handling
const ageResult = safeParse(userInput);
ageResult.fold(
  error => showError("Invalid age"),
  age => age > 18 ? allowAccess() : denyAccess()
);
```

---

## 📚 Getting Started Guide

### Step 1: Installation

```bash
npm install seiken-fx
```

### Step 2: Your First Result

```typescript
import { success, failure } from 'seiken-fx';

// Instead of throwing errors
function divide(a: number, b: number): Result<string, number> {
  if (b === 0) {
    return failure("Cannot divide by zero");
  }
  return success(a / b);
}

// Safe usage
const result = divide(10, 2);
console.log(result.getOrElse(0)); // 5

const badResult = divide(10, 0);
console.log(badResult.getOrElse(0)); // 0 (safe default)
```

### Step 3: Transforming Values

```typescript
// Transform success values, ignore failures
const doubled = divide(10, 2)
  .map(x => x * 2); // Success(10)

const stillFailed = divide(10, 0)
  .map(x => x * 2); // Still Failure("Cannot divide by zero")
```

### Step 4: Chaining Operations

```typescript
function squareRoot(x: number): Result<string, number> {
  if (x < 0) {
    return failure("Cannot sqrt negative");
  }
  return success(Math.sqrt(x));
}

// Chain operations - stops at first failure
const pipeline = divide(100, 4)     // Success(25)
  .flatMap(squareRoot)              // Success(5)
  .map(x => x * 2);                 // Success(10)

// With failure in chain
const failedPipeline = divide(100, 0)  // Failure("Cannot divide by zero")
  .flatMap(squareRoot)                 // Skipped!
  .map(x => x * 2);                    // Skipped!
  // Result: Still Failure("Cannot divide by zero")
```

### Step 5: Handling Both Cases

```typescript
// Pattern matching style
const message = pipeline.fold(
  error => `Error: ${error}`,
  value => `Result: ${value}`
);

// Elixir-style destructuring  
const [value, error] = pipeline.unwrap();
if (error) {
  console.error(error);
} else {
  console.log(value);
}
```

---

## 💡 Real-World Examples

### API Calls Made Safe

```typescript
import { fromPromise, getPath } from 'seiken-fx';

async function fetchUserProfile(userId: string) {
  // Convert Promise to Result
  const response = await fromPromise(
    fetch(`/api/users/${userId}`),
    err => `Network error: ${err}`
  );
  
  return response
    .flatMap(resp => tryCatch(() => resp.json(), () => "Invalid JSON"))
    .flatMap(data => getPath(['user', 'profile'], () => "No profile")(data))
    .map(profile => ({
      name: profile.name || 'Unknown',
      email: profile.email || 'No email'
    }));
}

// Usage
const [profile, error] = (await fetchUserProfile("123")).unwrap();
if (error) {
  showErrorMessage(error); // Specific error handling
} else {
  displayProfile(profile); // Guaranteed valid data
}
```

### Form Validation

```typescript
import { map, all } from 'seiken-fx';

function validateEmail(email: string): Result<string, string> {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return isValid ? success(email) : failure("Invalid email format");
}

function validateAge(age: string): Result<string, number> {
  const num = parseInt(age);
  if (isNaN(num)) return failure("Age must be a number");
  if (num < 0) return failure("Age cannot be negative");
  if (num > 150) return failure("Age seems unrealistic");
  return success(num);
}

function validateForm(data: { email: string; age: string }) {
  // Validate all fields, collect all errors
  return all([
    validateEmail(data.email),
    validateAge(data.age)
  ]).map(([email, age]) => ({ email, age }));
}

// Usage
const formResult = validateForm({ email: "john@doe.com", age: "25" });
formResult.fold(
  errors => showValidationErrors(errors),
  validData => submitForm(validData)
);
```

### Array Processing

```typescript
import { map, filter } from 'seiken-fx';

// Process arrays with potential failures
const numbers = ["1", "2", "invalid", "4"];

const processed = map((str: string) => {
  const num = parseInt(str);
  return isNaN(num) ? failure(`"${str}" is not a number`) : success(num);
})(numbers);

// Result: Failure("invalid" is not a number") - stops at first error

// Or filter out failures and continue
const validNumbers = filter((str: string) => {
  const num = parseInt(str);
  return success(!isNaN(num));
})(numbers);
// Success(["1", "2", "4"])
```

### Conditional Processing with .if().then().else()

```typescript
import { success, failure } from 'seiken-fx';

function processUser(user: any) {
  return success(user)
    .if(u => u.role === 'admin')
    .then(u => ({ ...u, permissions: ['read', 'write', 'delete'] }))
    .else(u => ({ ...u, permissions: ['read'] }));
}

// Usage
const adminUser = processUser({ name: 'John', role: 'admin' });
const regularUser = processUser({ name: 'Jane', role: 'user' });

// Both return Results with appropriate permissions
```

### Complex Logic with Pattern Matching

```typescript
import { success, failure } from 'seiken-fx';

function categorizeUser(user: any) {
  return success(user).match([
    // Admin users with full access
    [success, { role: 'admin', verified: true }, (u: any) => 
      `Full Admin: ${u.name} (${u.email})`
    ],
    
    // Verified regular users
    [success, { verified: true }, (u: any) => 
      `Verified User: ${u.name}`
    ],
    
    // Unverified users
    [success, { verified: false }, (u: any) => 
      `Pending Verification: ${u.name}`
    ],
    
    // Error cases
    [failure, (error: string) => `Error: ${error}`]
  ]);
}

// Usage
const result = categorizeUser({ 
  name: 'Alice', 
  role: 'admin', 
  verified: true,
  email: 'alice@example.com'
});
// Returns: "Full Admin: Alice (alice@example.com)"
```

---

## 🎯 When to Use seiken-fx

### ✅ Perfect for:
- **API integrations** - Network calls, JSON parsing
- **Form validation** - User input processing  
- **Data transformation** - Parsing, validation pipelines
- **File operations** - Reading, writing, processing files
- **Mathematical operations** - Division, square roots, etc.
- **Configuration loading** - Environment variables, config files

### 🤔 Maybe overkill for:
- Simple CRUD operations with well-defined schemas
- Internal function calls with guaranteed inputs
- Performance-critical hot paths (though the overhead is minimal)

---

## ✨ What Makes seiken-fx Unique

seiken-fx isn't just another functional programming library - it brings **fresh ideas** and **modern approaches** to error handling:

### 🎯 **Elixir-Style Destructuring**
Inspired by Elixir's pattern matching, but designed for TypeScript:
```typescript
// Most libraries force you to use methods
result.fold(handleError, handleSuccess);

// seiken-fx gives you choice - use destructuring like Elixir
const [data, error] = result.unwrap();
if (error) { /* handle error */ } else { /* use data */ }
```

### 🔄 **Fluid Conditional Execution**
New `.if().then().else()` methods for elegant, chainable conditional logic:
```typescript
// Execute actions based on predicates with fluent chaining
result
  .if(value => value > 10)
  .then(value => console.log(`${value} is large`))
  .else(value => console.log(`${value} is small`));

// Perfect for validation, logging, and conditional processing
userResult
  .if(user => user.age >= 18)
  .then(user => sendWelcomeEmail(user))
  .else(user => sendParentalConsent(user));
```

### 🎭 **Elixir-Style Pattern Matching**
Powerful `.match()` method for complex conditional logic with guards and destructuring:
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

### 🔄 **Dual Promise Integration**
Unique approach to Promise handling with both Result and tuple patterns:
```typescript
// Traditional Promise handling
fromPromise(fetch('/api'), err => `Error: ${err}`)

// Or Elixir-style tuples (unique to seiken-fx!)
const [data, error] = await fromPromiseTuple(fetch('/api'));
```

### 🧮 **Result-First Philosophy**
Unlike libraries that bolt Result types onto existing utilities, seiken-fx was **designed from the ground up** with Result as the primary pattern:
```typescript
// Every utility naturally returns Result - no cognitive overhead
const user = getPath(['user', 'profile'])(data)
  .flatMap(validateUser)
  .map(normalizeUser);
```

### 🚀 **Modern TypeScript Ergonomics**
Built specifically for TypeScript developers who want:
- **Zero runtime overhead** in production builds
- **Perfect type inference** without explicit generics
- **Tree-shakeable imports** for optimal bundle size
- **Developer-friendly error messages**

### 🎨 **Opinionated Simplicity**
While some libraries offer dozens of abstractions, seiken-fx focuses on **one powerful pattern** done extremely well:
- **One error handling strategy** (Result) instead of Option + Either + IO + ...
- **Intuitive naming** (`success`/`failure` vs `Right`/`Left`)
- **Practical utilities** for real-world problems, not academic exercises

---

## 🎯 Philosophy: Predictable by Design

seiken-fx follows these core principles:

1. **🛡️ Explicit over Implicit** - Every operation that can fail returns a Result
2. **🔗 Composable by Default** - All utilities chain naturally with flatMap
3. **📚 Learnable Progressively** - Start simple, grow into advanced patterns
4. **⚡ TypeScript Native** - Designed for TS developers, works great in JS
5. **🎯 Practical Focus** - Solves real problems developers face daily

---

## 📦 Full API Reference

**→ [Complete API Documentation](API_REFERENCE.md)**

For detailed documentation of all functions, methods, and utilities, see our comprehensive API reference guide. It includes:

- 🔥 **Result Core Functions** - `success`, `failure`, `tryCatch`, `all`
- 🔧 **Result Methods** - `.map()`, `.flatMap()`, `.fold()`, `.unwrap()`
- 🔄 **Conditional Execution** - `.if().then().else()` for chainable conditionals
- 🎭 **Pattern Matching** - `.match()` with guards and destructuring
- 📊 **Array Utilities** - `map`, `filter`, `reduce`, `head`, `tail`, `get`
- 🎯 **Object Utilities** - `prop`, `pick`, `omit`, `getPath`, `mapValues`, `clone`
- 🔄 **Function Composition** - `curry`, `compose`, `pipe`, `composeAsync`
- 🌐 **Promise Integration** - `fromPromise`, `fromPromiseTuple`

---

## 🚀 Migration Guide

### From try/catch

```typescript
// Before
function risky() {
  try {
    return dangerousOperation();
  } catch (error) {
    return null; // Lost error information!
  }
}

// After  
function safe() {
  return tryCatch(
    dangerousOperation,
    error => `Operation failed: ${error}`
  );
}
```

### From Promise.catch

```typescript
// Before
fetch('/api/data')
  .then(response => response.json())
  .catch(error => {
    // What kind of error? Network? JSON parse?
    console.error('Something failed:', error);
    return null;
  });

// After
fromPromise(fetch('/api/data'), err => `Network error: ${err}`)
  .flatMap(response => tryCatch(() => response.json(), () => "Invalid JSON"))
  .fold(
    error => console.error('Specific error:', error),
    data => console.log('Success:', data)
  );
```

---

## 🎓 Learning Resources

- **📖 [Functional Programming Concepts](#)** - Understanding Monads and functors
- **🛠️ [Migration Patterns](#)** - Common refactoring examples  
- **🎯 [Best Practices](#)** - When and how to use each utility
- **🔄 [Composition Patterns](#)** - Building complex operations

---

## ✨ Why Choose seiken-fx

1. **🛡️ No more runtime surprises** - Errors are explicit and typed
2. **🔗 Composable operations** - Chain operations without nested try/catch  
3. **🎯 Type-safe by design** - TypeScript prevents accessing invalid data
4. **� Elixir-style patterns** - Modern destructuring with `[value, error]` tuples
5. **⚡ Zero dependencies** - Lightweight and focused on one thing done well
6. **🚀 Gradual adoption** - Start small, expand usage over time
7. **🧪 100% tested** - Reliable foundation built from the ground up
8. **📚 Clear philosophy** - Result-first approach with predictable behavior

**seiken-fx brings fresh ideas to functional programming in TypeScript.** Built with modern developer experience in mind, it offers a unique blend of power and simplicity that makes error handling both safe and enjoyable.

Ready to experience predictable TypeScript code? Let's get started! 🚀
