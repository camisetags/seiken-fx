import { success, failure, Result } from '../src/result';

console.log('=== Pattern Matching Result-Based Examples ===\n');

console.log('1. Basic pattern matching returns Result:');
const numberResult = success(15);
const matchResult = numberResult.match([
  [success, (n: number) => n > 10, (n: number) => `Large: ${n}`],
  [success, (n: number) => n <= 10, (n: number) => `Small: ${n}`],
  [failure, (error: any) => `Error: ${error}`],
]);

console.log('Match result type:', typeof matchResult);
console.log('Is Success?', matchResult.isSuccess());
console.log('Value:', matchResult.getOrThrow());
console.log('Result object:', matchResult);

console.log('\n2. Chaining after .match() - using .map():');
const chainedResult = numberResult
  .match([
    [success, (n: number) => n > 10, (n: number) => `Large: ${n}`],
    [success, (n: number) => n <= 10, (n: number) => `Small: ${n}`],
  ])
  .map((message: string) => message.toUpperCase())
  .map((message: string) => `🎯 ${message}`);

console.log('Chained result:', chainedResult.getOrThrow());

console.log('\n3. Chaining after .match() - using .flatMap():');
const complexResult = numberResult
  .match([
    [success, (n: number) => n > 10, (n: number) => `Large: ${n}`],
    [success, (n: number) => n <= 10, (n: number) => `Small: ${n}`],
  ])
  .flatMap((message: string) => {
    if (message.includes('Large')) {
      return success(`🌟 ${message} - Premium category`);
    } else {
      return success(`📱 ${message} - Standard category`);
    }
  });

console.log('Complex chained result:', complexResult.getOrThrow());

console.log('\n4. Callbacks can return Result or primitive values:');
const userResult = success({ name: 'John', age: 25, role: 'admin' });

const adminResult = userResult.match([
  [
    success,
    (user: any) => user.role === 'admin',
    (user: any) => success(`👑 Admin: ${user.name}`), // Returns Result
  ],
  [
    success,
    (user: any) => user.role === 'user',
    (user: any) => `👤 User: ${user.name}`, // Returns string
  ],
  [failure, (error: any) => `❌ Error: ${error}`],
]);

console.log('Admin result type:', typeof adminResult);
console.log('Is Success?', adminResult.isSuccess());
console.log('Value:', adminResult.getOrThrow());

console.log('\n5. Error handling - no pattern matches returns Failure:');
const noMatchResult = success(5).match([
  [success, (n: number) => n > 10, (n: number) => `Large: ${n}`],
  // No pattern for n <= 10
]);

console.log('No match result type:', typeof noMatchResult);
console.log('Is Failure?', noMatchResult.isFailure());
console.log('Error:', noMatchResult.getOrThrow()); // This will throw

console.log('\n6. Failure patterns always return Result:');
const failureResult = failure('Database error');
const failureMatchResult = failureResult.match([
  [success, (value: any) => `Success: ${value}`],
  [failure, (error: any) => `❌ ${error}`],
]);

console.log('Failure match result type:', typeof failureMatchResult);
console.log('Is Success?', failureMatchResult.isSuccess());
console.log('Value:', failureMatchResult.getOrThrow());

console.log('\n=== End of Result-Based Pattern Matching Examples ===');
