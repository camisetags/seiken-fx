import { tryCatch, success, failure, Result } from '../src/result';

console.log('=== Examples of tryCatch usage ===\n');

console.log('1. Basic tryCatch with JSON parsing:');
const parseJson = (jsonString: string): Result<string, any> => {
  return tryCatch(
    () => JSON.parse(jsonString),           // Function that might throw
    (error) => `JSON parsing failed: ${error}`  // Error transformer
  );
};

// Success case
const validJsonResult = parseJson('{"name": "John", "age": 30}');
console.log('Valid JSON result:', validJsonResult.isSuccess() ? 'Success' : 'Failure');
if (validJsonResult.isSuccess()) {
  console.log('Parsed data:', validJsonResult.getOrThrow());
}

// Failure case
const invalidJsonResult = parseJson('{"name": "John", "age": 30'); // Missing closing brace
console.log('Invalid JSON result:', invalidJsonResult.isSuccess() ? 'Success' : 'Failure');
if (invalidJsonResult.isFailure()) {
  try {
    invalidJsonResult.getOrThrow();
  } catch (error) {
    console.log('Error message:', error);
  }
}

console.log('\n2. tryCatch with mathematical operations:');
const safeDivide = (a: number, b: number): Result<string, number> => {
  return tryCatch(
    () => {
      if (b === 0) {
        throw new Error('Division by zero');
      }
      return a / b;
    },
    (error) => `Math error: ${error}`
  );
};

console.log('Safe division 10 / 2:', safeDivide(10, 2).getOrThrow());
try {
  safeDivide(10, 0).getOrThrow();
} catch (error) {
  console.log('Safe division 10 / 0:', error);
}

console.log('\n3. tryCatch with file system operations (simulated):');
const readFile = (filename: string): Result<string, string> => {
  return tryCatch(
    () => {
      // Simulate file reading that might fail
      if (filename.includes('error')) {
        throw new Error('File not found');
      }
      if (filename.includes('permission')) {
        throw new Error('Permission denied');
      }
      return `Content of ${filename}`;
    },
    (error) => `File read error: ${error}`
  );
};

console.log('Reading normal file:', readFile('document.txt').getOrThrow());
try {
  readFile('error.txt').getOrThrow();
} catch (error) {
  console.log('Reading non-existent file:', error);
}
try {
  readFile('permission.txt').getOrThrow();
} catch (error) {
  console.log('Reading protected file:', error);
}

console.log('\n4. tryCatch with complex operations:');
const processUserData = (userData: any): Result<string, { name: string; age: number }> => {
  return tryCatch(
    () => {
      // Multiple operations that could fail
      if (!userData) {
        throw new Error('No user data provided');
      }
      
      if (!userData.name || typeof userData.name !== 'string') {
        throw new Error('Invalid or missing name');
      }
      
      if (!userData.age || typeof userData.age !== 'number' || userData.age < 0) {
        throw new Error('Invalid or missing age');
      }
      
      return {
        name: userData.name.toUpperCase(),
        age: userData.age
      };
    },
    (error) => `User data validation failed: ${error}`
  );
};

// Success case
const validUserResult = processUserData({ name: 'Alice', age: 25 });
console.log('Valid user result:', validUserResult.isSuccess() ? 'Success' : 'Failure');
if (validUserResult.isSuccess()) {
  const user = validUserResult.getOrThrow();
  console.log('Processed user:', user);
}

// Failure cases
const invalidUserResult1 = processUserData(null);
try {
  invalidUserResult1.getOrThrow();
} catch (error) {
  console.log('Null user result:', error);
}

const invalidUserResult2 = processUserData({ name: '', age: -5 });
try {
  invalidUserResult2.getOrThrow();
} catch (error) {
  console.log('Invalid user result:', error);
}

console.log('\n5. tryCatch with chaining:');
const result = tryCatch(
  () => {
    // Simulate some operation
    const random = Math.random();
    if (random < 0.3) {
      throw new Error('Random failure');
    }
    return random * 100;
  },
  (error) => `Operation failed: ${error}`
)
.map(value => Math.round(value))           // Transform success value
.flatMap(value => {
  if (value > 50) {
    return success(`High value: ${value}`);
  } else {
    return success(`Low value: ${value}`);
  }
});

console.log('Chained result:', result.getOrThrow());

console.log('\n6. tryCatch with custom error types:');
type ValidationError = {
  field: string;
  message: string;
  code: string;
};

const validateEmail = (email: string): Result<ValidationError, string> => {
  return tryCatch(
    () => {
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }
      
      if (email.length < 5) {
        throw new Error('Email too short');
      }
      
      return email.toLowerCase();
    },
    (error) => ({
      field: 'email',
      message: error instanceof Error ? error.message : String(error),
      code: 'VALIDATION_ERROR'
    })
  );
};

const emailResult = validateEmail('invalid-email');
if (emailResult.isFailure()) {
  const [, error] = emailResult.unwrap();
  console.log('Validation error:', error);
  if (error) {
    console.log('Field:', error.field);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
  }
}

console.log('\n7. tryCatch with async-like operations (simulated):');
const fetchUser = (userId: string): Result<string, { id: string; name: string }> => {
  return tryCatch(
    () => {
      // Simulate API call that might fail
      if (userId === 'error') {
        throw new Error('Network error');
      }
      
      if (userId === 'notfound') {
        throw new Error('User not found');
      }
      
      if (userId === 'timeout') {
        throw new Error('Request timeout');
      }
      
      return {
        id: userId,
        name: `User ${userId}`
      };
    },
    (error) => `API error: ${error}`
  );
};

const userResults = [
  fetchUser('123'),
  fetchUser('error'),
  fetchUser('notfound'),
  fetchUser('456')
];

console.log('User fetch results:');
userResults.forEach((result, index) => {
  if (result.isSuccess()) {
    const user = result.getOrThrow();
    console.log(`User ${index + 1}: Success - ${user.name}`);
  } else {
    try {
      result.getOrThrow();
    } catch (error) {
      console.log(`User ${index + 1}: Failure - ${error}`);
    }
  }
});

console.log('\n8. tryCatch with error recovery:');
const riskyOperation = (input: string): Result<string, string> => {
  return tryCatch(
    () => {
      if (input === 'crash') {
        throw new Error('System crash');
      }
      return `Processed: ${input}`;
    },
    (error) => `Operation failed: ${error}`
  )
  .recover(error => `Recovered from: ${error}`); // Try to recover from failure
};

console.log('Normal operation:', riskyOperation('hello').getOrThrow());
console.log('Crashed operation:', riskyOperation('crash').getOrThrow());

console.log('\n=== End of tryCatch examples ===');
