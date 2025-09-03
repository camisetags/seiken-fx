import { success, failure, Result } from '../src/result';

console.log('=== Examples of .try().catch() methods usage ===\n');

// Example 1: Basic .try().catch() with parseInt
console.log('1. Basic .try().catch() with parseInt:');
const numberResult = success("42")
  .try(parseInt)
  .catch(error => `Parse failed: ${error}`);

console.log('Input: "42"');
console.log('Result:', numberResult.isSuccess() ? `Success(${numberResult.getOrThrow()})` : `Failure(${numberResult.getOrElse('')})`);
console.log('');

// Example 2: .try().catch() with invalid input
console.log('2. .try().catch() with invalid input:');
const invalidResult = success("invalid")
  .try(parseInt)
  .catch(error => `Parse failed: ${error}`);

console.log('Input: "invalid"');
console.log('Result:', invalidResult.isSuccess() ? `Success(${invalidResult.getOrThrow()})` : `Failure(${invalidResult.getOrElse('')})`);
console.log('');

// Example 3: .try().catch() with mathematical operations
console.log('3. .try().catch() with mathematical operations:');
const mathResult = success(16)
  .try(value => Math.sqrt(value))
  .catch(error => `Math error: ${error}`)
  .map(value => value * 2);

console.log('Input: 16');
console.log('Operation: sqrt(16) * 2');
console.log('Result:', mathResult.isSuccess() ? `Success(${mathResult.getOrThrow()})` : `Failure(${mathResult.getOrElse('')})`);
console.log('');

// Example 4: .try().catch() with JSON operations
console.log('4. .try().catch() with JSON operations:');
const userData = { name: 'John', age: 30, email: 'john@example.com' };
const jsonResult = success(userData)
  .try(data => JSON.stringify(data))
  .catch(error => `JSON serialization failed: ${error}`)
  .try(json => JSON.parse(json))
  .catch(error => `JSON parsing failed: ${error}`);

console.log('Input:', userData);
console.log('Operation: JSON.stringify -> JSON.parse');
console.log('Result:', jsonResult.isSuccess() ? `Success(${JSON.stringify(jsonResult.getOrThrow())})` : `Failure(${jsonResult.getOrElse('')})`);
console.log('');

// Example 5: .try().catch() with array operations
console.log('5. .try().catch() with array operations:');
const arrayResult = success([1, 2, 3, 4, 5])
  .try(arr => arr.map(x => x * 2))
  .catch(error => `Array operation failed: ${error}`)
  .try(arr => arr.reduce((sum, x) => sum + x, 0))
  .catch(error => `Reduce operation failed: ${error}`);

console.log('Input: [1, 2, 3, 4, 5]');
console.log('Operation: map(x => x * 2) -> reduce(sum)');
console.log('Result:', arrayResult.isSuccess() ? `Success(${arrayResult.getOrThrow()})` : `Failure(${arrayResult.getOrElse('')})`);
console.log('');

// Example 6: .try().catch() with custom functions
console.log('6. .try().catch() with custom functions:');
const customFunction = (value: number): string => {
  if (value < 0) throw new Error('Value must be positive');
  if (value > 100) throw new Error('Value too large');
  return `Processed: ${value * 2}`;
};

const customResult = success(25)
  .try(customFunction)
  .catch(error => `Custom function failed: ${error}`);

console.log('Input: 25');
console.log('Custom function: value must be 0-100, returns value * 2');
console.log('Result:', customResult.isSuccess() ? `Success(${customResult.getOrThrow()})` : `Failure(${customResult.getOrElse('')})`);
console.log('');

// Example 7: .try().catch() with error cases
console.log('7. .try().catch() with error cases:');
const errorResult1 = success(-5)
  .try(customFunction)
  .catch(error => `Custom function failed: ${error}`);

const errorResult2 = success(150)
  .try(customFunction)
  .catch(error => `Custom function failed: ${error}`);

console.log('Input: -5 (negative)');
console.log('Result:', errorResult1.isSuccess() ? `Success(${errorResult1.getOrThrow()})` : `Failure(${errorResult1.getOrElse('')})`);

console.log('Input: 150 (too large)');
console.log('Result:', errorResult2.isSuccess() ? `Success(${errorResult2.getOrThrow()})` : `Failure(${errorResult2.getOrElse('')})`);
console.log('');

// Example 8: Chaining .try().catch() with other Result methods
console.log('8. Chaining .try().catch() with other Result methods:');
const chainResult = success("10")
  .try(parseInt)
  .catch(error => `Parse failed: ${error}`)
  .map(value => value * 2)
  .flatMap(value => value > 15 ? failure('Value too large') : success(value))
  .if(value => value > 5)
  .then(value => console.log(`  Value ${value} is greater than 5`))
  .else(value => console.log(`  Value ${value} is 5 or less`));

console.log('Input: "10"');
console.log('Chain: parseInt -> *2 -> validate -> if/else');
console.log('Result:', chainResult.isSuccess() ? `Success(${chainResult.getOrThrow()})` : `Failure(${chainResult.getOrElse('')})`);
console.log('');

// Example 9: .try().catch() with async-like operations
console.log('9. .try().catch() with async-like operations:');
const simulateAsyncOperation = (value: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (value % 2 === 0) {
        resolve(`Even number: ${value}`);
      } else {
        reject(new Error(`Odd number: ${value}`));
      }
    }, 100);
  });
};

// Simulating async operation with .try().catch()
const asyncResult = success(8)
  .try(async (value) => {
    const result = await simulateAsyncOperation(value);
    return result;
  })
  .catch(error => `Async operation failed: ${error}`);

console.log('Input: 8 (even number)');
console.log('Async operation: resolve for even, reject for odd');
console.log('Result:', asyncResult.isSuccess() ? `Success(${asyncResult.getOrThrow()})` : `Failure(${asyncResult.getOrElse('')})`);
console.log('');

// Example 10: Complex error handling pipeline
console.log('10. Complex error handling pipeline:');
const complexPipeline = (input: string) => {
  return success(input)
    .try(parseInt)
    .catch(error => `Parse failed: ${error}`)
    .flatMap(number => {
      if (number < 0) return failure('Number must be positive');
      if (number > 1000) return failure('Number too large');
      return success(number);
    })
    .try(number => Math.sqrt(number))
    .catch(error => `Square root failed: ${error}`)
    .map(sqrt => Math.round(sqrt * 100) / 100)
    .try(sqrt => `Result: ${sqrt}`)
    .catch(error => `Formatting failed: ${error}`);
};

const complexResult1 = complexPipeline("64");
const complexResult2 = complexPipeline("invalid");
const complexResult3 = complexPipeline("-5");
const complexResult4 = complexPipeline("2000");

console.log('Complex pipeline: parseInt -> validate -> sqrt -> round -> format');
console.log('Input: "64" ->', complexResult1.isSuccess() ? complexResult1.getOrThrow() : complexResult1.getOrElse(''));
console.log('Input: "invalid" ->', complexResult2.isSuccess() ? complexResult2.getOrThrow() : complexResult2.getOrElse(''));
console.log('Input: "-5" ->', complexResult3.isSuccess() ? complexResult3.getOrThrow() : complexResult3.getOrElse(''));
console.log('Input: "2000" ->', complexResult4.isSuccess() ? complexResult4.getOrThrow() : complexResult4.getOrElse(''));
console.log('');

console.log('=== End of .try().catch() Examples ===');
