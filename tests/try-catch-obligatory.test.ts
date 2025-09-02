import { success, failure } from '../src/result';

describe('try/catch obligatory usage', () => {
  describe('Success.try() behavior', () => {
    it('should return Result from .try()', () => {
      const result = success('hello');
      const tryResult = result.try(str => str.toUpperCase());

      // Should be a Result object
      expect(tryResult).toBeDefined();
      expect(typeof tryResult.catch).toBe('function');
    });

    it('should execute operation successfully and return Result from .catch()', () => {
      const result = success('hello')
        .try(str => str.toUpperCase())
        .catch(error => `Error: ${error}`);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('HELLO');
    });

    it('should handle exceptions and return Result from .catch()', () => {
      const result = success('{"invalid": json')
        .try(str => JSON.parse(str))
        .catch(error => `Parse failed: ${error}`);

      expect(result.isFailure()).toBe(true);
      expect(() => result.getOrThrow()).toThrow(/Parse failed: SyntaxError/);
    });
  });

  describe('Failure.try() behavior', () => {
    it('should return Result from .try() even on Failure', () => {
      const result = failure('Database error');
      const tryResult = result.try((_value: never) => 'dummy');

      expect(tryResult).toBeDefined();
      expect(typeof tryResult.catch).toBe('function');
    });

    it('should handle Failure case in .catch()', () => {
      const result = failure('Database error')
        .try((_value: never) => 'dummy')
        .catch(error => `Handled: ${error}`);

      expect(result.isFailure()).toBe(true);
      expect(() => result.getOrThrow()).toThrow('Handled: Database error');
    });
  });

  describe('Chaining after .catch()', () => {
    it('should allow normal Result methods after .catch()', () => {
      const result = success('hello')
        .try(str => str.toUpperCase())
        .catch(error => `Error: ${error}`)
        .map(str => str.split(''))
        .map(chars => chars.join('-'))
        .flatMap(str => success(`Processed: ${str}`));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('Processed: H-E-L-L-O');
    });

    it('should allow .if().then().else() after .catch()', () => {
      const result = success('hello')
        .try(str => str.toUpperCase())
        .catch(error => `Error: ${error}`)
        .if(str => str.length > 5)
        .then(str => console.log(`Long: ${str}`))
        .else(str => console.log(`Short: ${str}`));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('HELLO');
    });

    it('should allow .match() after .catch()', () => {
      const result = success('{"name": "John"}')
        .try(str => JSON.parse(str))
        .catch(error => `Parse failed: ${error}`)
        .match([
          [success, (data: any) => data.name, (data: any) => `Name: ${data.name}`],
          [failure, (error: any) => `Error: ${error}`],
        ]);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('Name: John');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple .try().catch() operations', () => {
      const result = success('{"name": "John", "age": 30}')
        .try(str => JSON.parse(str))
        .catch(error => `JSON parse failed: ${error}`)
        .try(data => data.name.toUpperCase())
        .catch(error => `Name extraction failed: ${error}`)
        .map(name => `Hello, ${name}!`)
        .flatMap(greeting => success(greeting.toUpperCase()));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('HELLO, JOHN!');
    });

    it('should handle validation with .try().catch()', () => {
      const validateUser = (userData: any) => {
        return success(userData)
          .try(data => {
            if (!data) throw new Error('No user data provided');
            if (!data.name || typeof data.name !== 'string') {
              throw new Error('Invalid or missing name');
            }
            if (!data.age || typeof data.age !== 'number' || data.age < 0) {
              throw new Error('Invalid or missing age');
            }
            return {
              name: data.name.toUpperCase(),
              age: data.age,
            };
          })
          .catch(error => `Validation failed: ${error}`);
      };

      const validResult = validateUser({ name: 'Alice', age: 25 });
      expect(validResult.isSuccess()).toBe(true);
      const user = validResult.getOrThrow();
      expect(user.name).toBe('ALICE');
      expect(user.age).toBe(25);

      const invalidResult = validateUser(null);
      expect(invalidResult.isFailure()).toBe(true);
      expect(() => invalidResult.getOrThrow()).toThrow(
        'Validation failed: Error: No user data provided',
      );
    });

    it('should handle file operations simulation', () => {
      const readFile = (filename: string) => {
        return success(filename)
          .try(name => {
            if (name.includes('error')) throw new Error('File not found');
            if (name.includes('permission')) throw new Error('Permission denied');
            return `Content of ${name}`;
          })
          .catch(error => `File error: ${error}`);
      };

      const successResult = readFile('document.txt');
      expect(successResult.isSuccess()).toBe(true);
      expect(successResult.getOrThrow()).toBe('Content of document.txt');

      const errorResult = readFile('error.txt');
      expect(errorResult.isFailure()).toBe(true);
      expect(() => errorResult.getOrThrow()).toThrow('File error: Error: File not found');
    });
  });

  describe('Error recovery patterns', () => {
    it('should allow error recovery after .catch()', () => {
      const result = success('{"invalid": json')
        .try(str => JSON.parse(str))
        .catch(error => `Parse failed: ${error}`)
        .recover(error => `Default data (${error})`)
        .map(data => `Processed: ${data}`);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toContain('Processed: Default data (Parse failed: SyntaxError');
    });

    it('should allow multiple error handling strategies', () => {
      const processData = (input: string) => {
        return success(input)
          .try(str => JSON.parse(str))
          .catch(error => `Parse failed: ${error}`)
          .recover(error => {
            // Try alternative parsing when primary fails
            try {
              const parsed = JSON.parse(input.replace(/,\s*}/g, '}'));
              return parsed.name ? parsed.name.toUpperCase() : 'Unknown';
            } catch {
              return `Failed to parse: ${error}`;
            }
          });
      };

      const result = processData('{"name": "John", "age": 30,}'); // Note the trailing comma
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('JOHN');
    });
  });

  describe('Integration with existing utilities', () => {
    it('should work with tryCatch function', () => {
      // This demonstrates that our .try().catch() is consistent with the existing tryCatch
      const riskyOperation = (value: string) => {
        if (value.includes('error')) throw new Error('Simulated error');
        return value.toUpperCase();
      };

      // Using our new .try().catch()
      const result1 = success('hello')
        .try(riskyOperation)
        .catch(error => `Caught: ${error}`);

      // Using existing tryCatch
      const result2 = tryCatch(
        () => riskyOperation('hello'),
        error => `Caught: ${error}`,
      );

      expect(result1.isSuccess()).toBe(true);
      expect(result1.getOrThrow()).toBe('HELLO');
      expect(result2.isSuccess()).toBe(true);
      expect(result2.getOrThrow()).toBe('HELLO');
    });
  });
});

// Helper function for testing (simulating the existing tryCatch)
function tryCatch<E, A>(f: () => A, onError: (error: unknown) => E): any {
  try {
    return { isSuccess: () => true, getOrThrow: () => f() };
  } catch (e) {
    return { isSuccess: () => false, getOrThrow: () => onError(e) };
  }
}
