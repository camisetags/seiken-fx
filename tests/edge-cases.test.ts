// @ts-nocheck - Many edge case tests require bypassing strict type checking
import { success, failure, tryCatch, all } from '../src/result';
import { map, filter, reduce, head, tail, get } from '../src/array';
import { prop, pick, merge } from '../src/object';

describe('Edge Cases Tests', () => {
  describe('Result Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(success(null).isSuccess()).toBe(true);
      expect(success(undefined).isSuccess()).toBe(true);
      expect(success(null).getOrThrow()).toBe(null);
      expect(success(undefined).getOrThrow()).toBe(undefined);
    });

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const result = success(largeNumber).map(x => x + 1);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(largeNumber + 1);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      const result = success(longString)
        .map(str => str.toUpperCase())
        .map(str => str.length);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(100000);
    });

    it('should handle circular references in errors', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      const result = failure(circularObj);
      expect(result.isFailure()).toBe(true);
      expect(result.fold(err => err, () => '')).toBe(circularObj);
    });

    it('should handle deeply nested Result chains', () => {
      let result = success(0);
      
      // Create a chain of 10000 operations
      for (let i = 0; i < 10000; i++) {
        result = result.flatMap(x => success(x + 1));
      }
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(10000);
    });
  });

  describe('Array Edge Cases', () => {
    it('should handle empty arrays', () => {
      const empty: number[] = [];
      
      expect(map((x: number) => success(x * 2))(empty).getOrThrow()).toEqual([]);
      expect(filter((x: number) => success(x > 0))(empty).getOrThrow()).toEqual([]);
      expect(reduce((acc: number, x: number) => success(acc + x), 0)(empty).getOrThrow()).toBe(0);
      expect(head(empty, () => 'empty').isFailure()).toBe(true);
      expect(tail(empty).isSuccess()).toBe(true);
      expect(get(0, () => 'missing')(empty).isFailure()).toBe(true);
    });

    it('should handle arrays with null/undefined values', () => {
      const mixedArray = [1, null, 3, undefined, 5];
      
      const mapped = map((x: any) => success(x === null ? 0 : x === undefined ? -1 : x * 2))(mixedArray);
      expect(mapped.getOrThrow()).toEqual([2, 0, 6, -1, 10]);
      
      const filtered = filter((x: any) => success(x != null))(mixedArray);
      expect(filtered.getOrThrow()).toEqual([1, 3, 5]);
    });

    it('should handle very large arrays', () => {
      const largeArray = Array.from({ length: 1000000 }, (_, i) => i);
      
      const start = Date.now();
      const result = head(largeArray, () => 'empty');
      const duration = Date.now() - start;
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(0);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle arrays with mixed types', () => {
      const mixedArray = [1, 'hello', { a: 1 }, [1, 2], true, null];
      
      const mapped = map((x: any) => success(typeof x))(mixedArray);
      expect(mapped.getOrThrow()).toEqual(['number', 'string', 'object', 'object', 'boolean', 'object']);
    });

    it('should handle negative indices safely', () => {
      const array = [1, 2, 3, 4, 5];
      
      expect(get(-1, () => 'invalid')(array).isFailure()).toBe(true);
      expect(get(-10, () => 'invalid')(array).isFailure()).toBe(true);
    });

    it('should handle all() with mixed Results', () => {
      const results = [
        success(1),
        success(2),
        failure('error'),
        success(3)
      ];
      
      const combined = all(results);
      expect(combined.isFailure()).toBe(true);
      expect(combined.fold(err => err, () => '')).toBe('error');
    });

    it('should handle all() with empty array', () => {
      const results: any[] = [];
      const combined = all(results);
      
      expect(combined.isSuccess()).toBe(true);
      expect(combined.getOrThrow()).toEqual([]);
    });
  });

  describe('Object Edge Cases', () => {
    it('should handle empty objects', () => {
      const empty = {};
      
      expect(prop('nonexistent', () => 'missing')(empty).isFailure()).toBe(true);
      expect(pick(['a', 'b'], (key: any) => `missing ${key}`)(empty).isFailure()).toBe(true);
      expect(merge((_key: string, _target: unknown, source: unknown) => success(source))({ a: 1 }).getOrThrow()).toEqual({ a: 1 });
    });

    it('should handle objects with null/undefined properties', () => {
      const obj = { a: 1, b: null, c: undefined, d: 'hello' };
      
      expect(prop('a', () => 'missing')(obj).getOrThrow()).toBe(1);
      expect(prop('b', () => 'missing')(obj).getOrThrow()).toBe(null);
      expect(prop('c', () => 'missing')(obj).isFailure()).toBe(true); // undefined values are treated as missing
      expect(prop('d', () => 'missing')(obj).getOrThrow()).toBe('hello');
    });

    it('should handle objects with special property names', () => {
      const obj = {
        '': 'empty string key',
        ' ': 'space key',
        'weird-key': 'dash key',
        '123': 'numeric key',
        'constructor': 'constructor key',
        '__proto__': 'proto key'
      };
      
      expect(prop('', () => 'missing')(obj).getOrThrow()).toBe('empty string key');
      expect(prop(' ', () => 'missing')(obj).getOrThrow()).toBe('space key');
      expect(prop('weird-key', () => 'missing')(obj).getOrThrow()).toBe('dash key');
      expect(prop('123', () => 'missing')(obj).getOrThrow()).toBe('numeric key');
    });

    it('should handle nested objects safely', () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };
      
      const result = prop('level1', () => 'missing')(nested)
        .flatMap(l1 => prop('level2', () => 'missing')(l1))
        .flatMap(l2 => prop('level3', () => 'missing')(l2))
        .flatMap(l3 => prop('value', () => 'missing')(l3));
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('deep');
    });

    it('should handle circular object references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(prop('name', () => 'missing')(circular).getOrThrow()).toBe('test');
      expect(prop('self', () => 'missing')(circular).getOrThrow()).toBe(circular);
    });

    it('should handle objects with prototype properties', () => {
      function CustomObject(this: any, name: string) {
        this.name = name;
      }
      CustomObject.prototype.getName = function() { return this.name; };
      
      const obj = new (CustomObject)('test');
      
      expect(prop('name', () => 'missing')(obj).getOrThrow()).toBe('test');
      expect(prop('getName', () => 'missing')(obj).isSuccess()).toBe(true);
    });

    it('should handle pick with non-existent properties', () => {
      const obj = { a: 1, b: 2 };
      const result = pick(['a', 'nonexistent', 'b', 'alsononexistent'], (key: any) => `missing ${key}`)(obj);
      
      expect(result.isFailure()).toBe(true);
      expect(result.fold(err => err, () => null)).toBe('missing nonexistent');
    });

    it('should handle merge with conflicting properties', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { b: 20, c: 30, d: 4 };
      
      const merged = merge((_key: string, _target: unknown, source: unknown) => success(source))(obj1, obj2);
      expect(merged.getOrThrow()).toEqual({ a: 1, b: 20, c: 30, d: 4 });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory pressure gracefully', () => {
      // Create many Results and then release them
      const results = [];
      
      for (let i = 0; i < 100000; i++) {
        results.push(success(i).map(x => x * 2));
      }
      
      // Process all results
      let sum = 0;
      for (const result of results) {
        if (result.isSuccess()) {
          sum += result.getOrThrow();
        }
      }
      
      expect(sum).toBe(9999900000); // Sum of 0*2 + 1*2 + ... + 99999*2
    });

    it('should handle rapid creation and destruction', () => {
      const iterations = 100000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = success(i)
          .map(x => x * 2)
          .flatMap(x => x > 50000 ? success(x) : failure('too small'));
        
        // Immediately use and discard
        result.fold(
          error => error.length,
          value => value + 1
        );
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle stack overflow prevention', () => {
      // Create a very deep chain that would cause stack overflow with naive implementation
      let result = success(0);
      
      const chainLength = 50000;
      for (let i = 0; i < chainLength; i++) {
        result = result.flatMap(x => success(x + 1));
      }
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(chainLength);
    });
  });

  describe('Type System Edge Cases', () => {
    it('should handle mixed error types', () => {
      const stringError = failure('string error');
      const numberError = failure(42);
      const objectError = failure({ code: 500, message: 'server error' });
      const arrayError = failure(['error1', 'error2']);
      
      expect(stringError.fold(err => err, () => '')).toBe('string error');
      expect(numberError.fold(err => err, () => null)).toBe(42);
      expect(objectError.fold(err => err, () => null)).toEqual({ code: 500, message: 'server error' });
      expect(arrayError.fold(err => err, () => null)).toEqual(['error1', 'error2']);
    });

    it('should handle complex nested types', () => {
      interface User {
        id: number;
        profile: {
          name: string;
          settings: {
            theme: 'light' | 'dark';
            notifications: boolean;
          };
        };
      }
      
      const user: User = {
        id: 1,
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true
          }
        }
      };
      
      const result = success(user)
        .map(u => u.profile)
        .map(p => p.settings)
        .map(s => s.theme);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('dark');
    });

    it('should handle function types as values', () => {
      const fn = (x: number) => x * 2;
      const result = success(fn).map(f => f(5));
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(10);
    });

    it('should handle promise-like objects', () => {
      const promiseLike = {
        then: (onResolve: (value: string) => void) => onResolve('resolved'),
        catch: () => {}
      };
      
      const result = success(promiseLike);
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(promiseLike);
    });
  });

  describe('Error Boundary Cases', () => {
    it('should handle errors that throw during processing', () => {
      const throwingFunction = () => {
        throw new Error('This function always throws');
      };
      
      // This should be handled by tryCatch
      const result = tryCatch(throwingFunction, error => `Caught: ${error}`);
      expect(result.isFailure()).toBe(true);
      expect(result.fold(err => err, () => '')).toContain('Caught:');
    });

    it('should handle errors in fold functions', () => {
      const result = success(42);
      
      // Test that fold executes the success callback and can throw
      expect(() => {
        result.fold(
          error => error,
          value => {
            if (value > 40) throw new Error('Value too large');
            return value * 2;
          }
        );
      }).toThrow('Value too large');
      
      // The original result is unchanged
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(42);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"name": "test", "invalid": }';
      
      const result = tryCatch(
        () => JSON.parse(malformedJson),
        () => ({ error: 'Invalid JSON' })
      );
      
      expect(result.isFailure()).toBe(true);
      expect(result.fold(err => err, () => null)).toEqual({ error: 'Invalid JSON' });
    });
  });
});