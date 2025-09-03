import { success, failure } from '../src/result';

describe('matchSimple API', () => {
  describe('Success cases', () => {
    test('should handle onSuccess with correct type inference', () => {
      const result = success('hello');
      const output = result.matchSimple({
        onSuccess: (value) => `Got: ${value}`,
        onFailure: (error) => `Error: ${error}`
      });
      
      expect(output).toBe('Got: hello');
    });

    test('should handle Success with only onSuccess handler', () => {
      const result = success(42);
      const output = result.matchSimple({
        onSuccess: (value) => value * 2
      });
      
      expect(output).toBe(84);
    });

    test('should preserve complex types in Success', () => {
      interface User {
        id: number;
        name: string;
        active: boolean;
      }

      const user: User = { id: 1, name: 'John', active: true };
      const result = success(user);
      
      const output = result.matchSimple({
        onSuccess: (u) => {
          // TypeScript should infer u as User type
          return u.active ? `Active user: ${u.name}` : `Inactive user: ${u.name}`;
        },
        onFailure: (error) => `Error: ${error}`
      });
      
      expect(output).toBe('Active user: John');
    });

    test('should work with function return types', () => {
      const result = success('test');
      
      const output = result.matchSimple({
        onSuccess: (value) => ({ processed: true, data: value }),
        onFailure: (error) => ({ processed: false, data: String(error) })
      });
      
      expect(output).toEqual({ processed: true, data: 'test' });
    });
  });

  describe('Failure cases', () => {
    test('should handle onFailure with correct type inference', () => {
      const result = failure('database error');
      const output = result.matchSimple({
        onSuccess: (value) => `Success: ${value}`,
        onFailure: (error) => `Error handled: ${error}`
      });
      
      expect(output).toBe('Error handled: database error');
    });

    test('should handle Failure with only onFailure handler', () => {
      const result = failure('connection failed');
      const output = result.matchSimple({
        onFailure: (error) => `Handled: ${error}`
      });
      
      expect(output).toBe('Handled: connection failed');
    });

    test('should preserve error types in Failure', () => {
      interface ApiError {
        code: number;
        message: string;
      }

      const error: ApiError = { code: 500, message: 'Internal server error' };
      const result = failure(error);
      
      const output = result.matchSimple({
        onSuccess: (value) => `Success: ${value}`,
        onFailure: (err) => {
          // TypeScript should infer err as ApiError type
          return `API Error ${err.code}: ${err.message}`;
        }
      });
      
      expect(output).toBe('API Error 500: Internal server error');
    });
  });

  describe('Edge cases', () => {
    test('should handle null and undefined values', () => {
      const nullResult = success(null);
      const nullOutput = nullResult.matchSimple({
        onSuccess: (value) => `Null value: ${value}`,
        onFailure: (error) => `Error: ${error}`
      });
      
      expect(nullOutput).toBe('Null value: null');

      const undefinedResult = success(undefined);
      const undefinedOutput = undefinedResult.matchSimple({
        onSuccess: (value) => `Undefined value: ${value}`,
        onFailure: (error) => `Error: ${error}`
      });
      
      expect(undefinedOutput).toBe('Undefined value: undefined');
    });

    test('should handle boolean values correctly', () => {
      const trueResult = success(true);
      const falseResult = success(false);
      
      const trueOutput = trueResult.matchSimple({
        onSuccess: (value) => value ? 'is true' : 'is false'
      });
      
      const falseOutput = falseResult.matchSimple({
        onSuccess: (value) => value ? 'is true' : 'is false'
      });
      
      expect(trueOutput).toBe('is true');
      expect(falseOutput).toBe('is false');
    });

    test('should handle numeric types including zero', () => {
      const zeroResult = success(0);
      const output = zeroResult.matchSimple({
        onSuccess: (value) => `Number: ${value}`,
        onFailure: (error) => `Error: ${error}`
      });
      
      expect(output).toBe('Number: 0');
    });
  });

  describe('Comparison with original match API', () => {
    test('should produce same results as original match for basic cases', () => {
      const value = 'test value';
      const successResult = success(value);
      
      // Original API
      const originalOutput = successResult.match([
        [success, (v: any) => `Success: ${v}`],
        [failure, (e: any) => `Error: ${e}`]
      ]);
      
      // New API
      const newOutput = successResult.matchSimple({
        onSuccess: (v) => `Success: ${v}`,
        onFailure: (e) => `Error: ${e}`
      });
      
      // Both should be successful, but original returns Result, new returns direct value
      expect(originalOutput.isSuccess()).toBe(true);
      if (originalOutput.isSuccess()) {
        expect(originalOutput.value).toBe(newOutput);
      }
    });

    test('should be more type-safe than original match', () => {
      interface StrictType {
        id: number;
        data: string;
      }

      const data: StrictType = { id: 1, data: 'test' };
      const result = success(data);
      
      // New API provides better type inference
      const output = result.matchSimple({
        onSuccess: (value) => {
          // value is properly typed as StrictType
          return value.id + value.data.length;
        },
        onFailure: (_error) => 0
      });
      
      expect(output).toBe(5); // 1 + 4 ('test'.length)
    });
  });
});