import { success, failure, all, tryCatch } from '../src/result';
import { map, filter, reduce, get, head, tail } from '../src/array';
import { prop, pick, has } from '../src/object';

describe('Edge Cases and Boundary Tests', () => {
  describe('Extreme Data Sizes', () => {
    it('should handle empty arrays gracefully', () => {
      const emptyArray: number[] = [];
      
      const mapResult = map((x: number) => success(x * 2))(emptyArray);
      expect(mapResult.isSuccess()).toBe(true);
      expect(mapResult.getOrThrow()).toEqual([]);

      const filterResult = filter((x: number) => success(x > 0))(emptyArray);
      expect(filterResult.isSuccess()).toBe(true);
      expect(filterResult.getOrThrow()).toEqual([]);

      const reduceResult = reduce((acc: number, curr: number) => success(acc + curr), 0)(emptyArray);
      expect(reduceResult.isSuccess()).toBe(true);
      expect(reduceResult.getOrThrow()).toBe(0);

      const headResult = head(emptyArray, () => 'empty');
      expect(headResult.isFailure()).toBe(true);
    });

    it('should handle empty objects gracefully', () => {
      const emptyObj = {};
      
      const propResult = (prop as any)('nonExistent', () => 'not found')(emptyObj);
      expect(propResult.isFailure()).toBe(true);

      const pickResult = (pick as any)(['a', 'b', 'c'], (key: any) => `missing: ${key}`)(emptyObj);
      expect(pickResult.isFailure()).toBe(true); // Should fail when keys don't exist

      const hasResult = (has as any)('anything', () => 'not found')(emptyObj);
      expect(hasResult.isSuccess()).toBe(true);
      expect(hasResult.getOrThrow()).toBe(false);
    });

    it('should handle single element arrays', () => {
      const singleArray = [42];
      
      const mapResult = map((x: number) => success(x.toString()))(singleArray);
      expect(mapResult.isSuccess()).toBe(true);
      expect(mapResult.getOrThrow()).toEqual(['42']);

      const headResult = head(singleArray, () => 'empty');
      expect(headResult.isSuccess()).toBe(true);
      expect(headResult.getOrThrow()).toBe(42);

      const tailResult = tail(singleArray);
      expect(tailResult.isSuccess()).toBe(true);
      expect(tailResult.getOrThrow()).toEqual([]);
    });

    it('should handle arrays with null/undefined values', () => {
      const nullishArray = [1, null, undefined, 0, '', false, NaN];
      
      const mapResult = map((x: any) => success(x))(nullishArray);
      expect(mapResult.isSuccess()).toBe(true);
      expect(mapResult.getOrThrow()).toEqual([1, null, undefined, 0, '', false, NaN]);

      const filterResult = filter((x: any) => success(Boolean(x)))(nullishArray);
      expect(filterResult.isSuccess()).toBe(true);
      expect(filterResult.getOrThrow()).toEqual([1]);
    });
  });

  describe('Data Type Edge Cases', () => {
    it('should handle special number values', () => {
      const specialNumbers = [Infinity, -Infinity, NaN, Number.MAX_VALUE, Number.MIN_VALUE];
      
      const mapResult = map((x: number) => success(x.toString()))(specialNumbers);
      expect(mapResult.isSuccess()).toBe(true);
      
      const result = mapResult.getOrThrow();
      expect(result).toContain('Infinity');
      expect(result).toContain('-Infinity');
      expect(result).toContain('NaN');
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      // These operations should not crash even with circular references
      const propResult = (prop as any)('name', () => 'not found')(circularObj);
      expect(propResult.isSuccess()).toBe(true);
      expect(propResult.getOrThrow()).toBe('test');

      const hasResult = has('self')(circularObj);
      expect(hasResult.isSuccess()).toBe(true);
      expect(hasResult.getOrThrow()).toBe(true);
    });

    it('should handle very long strings', () => {
      const veryLongString = 'a'.repeat(1000000); // 1MB string
      
      const result = success(veryLongString)
        .map(s => s.length)
        .map(len => len > 999999);
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(true);
    });

    it('should handle objects with symbol properties', () => {
      const symbolKey = Symbol('test');
      const objWithSymbol = {
        [symbolKey]: 'symbol-value',
        regularProp: 'regular-value'
      };
      
      const propResult = (prop as any)('regularProp', () => 'not found')(objWithSymbol);
      expect(propResult.isSuccess()).toBe(true);
      expect(propResult.getOrThrow()).toBe('regular-value');
    });

    it('should handle arrays with holes (sparse arrays)', () => {
      const sparseArray = new Array(1000);
      sparseArray[0] = 'first';
      sparseArray[999] = 'last';
      
      const headResult = head(sparseArray, () => 'empty');
      expect(headResult.isSuccess()).toBe(true);
      expect(headResult.getOrThrow()).toBe('first');

      const getResult = get(500, () => 'not found')(sparseArray);
      expect(getResult.isSuccess()).toBe(true);
      expect(getResult.getOrThrow()).toBeUndefined();
    });
  });

  describe('Error Boundary Tests', () => {
    it('should handle functions that throw different error types', () => {
      const errorTypes = [
        () => { throw new Error('Regular Error'); },
        () => { throw new TypeError('Type Error'); },
        () => { throw new RangeError('Range Error'); },
        () => { throw 'String error'; },
        () => { throw 42; },
        () => { throw null; },
        () => { throw undefined; },
        () => { throw { custom: 'error' }; }
      ];

      errorTypes.forEach((errorFn) => {
        const result = tryCatch(errorFn, (error) => `Caught: ${error}`);
        expect(result.isFailure()).toBe(true);
      });
    });

    it('should handle very deep call stacks without stack overflow', () => {
      // Create a very deep chain
      let result: any = success(0);
      for (let i = 0; i < 10000; i++) {
        result = result.flatMap((x: number) => success(x + 1));
      }
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(10000);
    });

    it('should handle operations on frozen/sealed objects', () => {
      const frozenObj = Object.freeze({ a: 1, b: 2 });
      const sealedObj = Object.seal({ x: 10, y: 20 });
      
      const frozenProp = (prop as any)('a', () => 'not found')(frozenObj);
      expect(frozenProp.isSuccess()).toBe(true);
      expect(frozenProp.getOrThrow()).toBe(1);

      const sealedPick = (pick as any)(['x'], (key: any) => `missing: ${key}`)(sealedObj);
      expect(sealedPick.isSuccess()).toBe(true);
      expect(sealedPick.getOrThrow()).toEqual({ x: 10 });
    });
  });

  describe('Memory and Resource Edge Cases', () => {
    it('should handle rapid creation and destruction of Results', () => {
      // Create and discard many Results rapidly
      for (let i = 0; i < 100000; i++) {
        const result = success(i)
          .map(x => x * 2)
          .flatMap(x => success(x + 1))
          .map(x => x.toString())
          .recover(() => 'fallback');
        
        // Touch the result to ensure it's not optimized away
        result.isSuccess();
      }
      
      // If we get here without crashing, the test passes
      expect(true).toBe(true);
    });

    it('should handle operations during garbage collection pressure', () => {
      const createPressure = () => {
        // Create memory pressure
        const temp = [];
        for (let i = 0; i < 10000; i++) {
          temp.push(new Array(1000).fill(Math.random()));
        }
        return temp.length;
      };

      let results: any[] = [];
      
      for (let i = 0; i < 100; i++) {
        createPressure(); // Create memory pressure
        
        const result = success(i)
          .map(x => ({ value: x, pressure: createPressure() }))
          .flatMap(x => success(x.value));
        
        results.push(result);
      }
      
      // All results should still be valid
      results.forEach((result, index) => {
        expect(result.isSuccess()).toBe(true);
        expect(result.getOrThrow()).toBe(index);
      });
    });
  });

  describe('Concurrency Edge Cases', () => {
    it('should handle simultaneous operations on shared data', async () => {
      const sharedArray = Array.from({ length: 10000 }, (_, i) => i);
      
      // Run multiple operations concurrently on the same data
      const operations = [
        () => map((x: number) => success(x * 2))(sharedArray),
        () => filter((x: number) => success(x % 2 === 0))(sharedArray),
        () => reduce((acc: number, curr: number) => success(acc + curr), 0)(sharedArray),
        () => head(sharedArray, () => 'empty'),
        () => get(5000, () => 'not found')(sharedArray)
      ];

      const promises = operations.map(op => 
        Promise.resolve().then(() => op())
      );

      const results = await Promise.all(promises);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.isSuccess()).toBe(true);
      });
    });

    it('should handle race conditions in Result chains', async () => {
      const results = await Promise.all(
        Array.from({ length: 100 }, async (_, i) => {
          return new Promise(resolve => {
            // Random delay to create race conditions
            setTimeout(() => {
              const result = success(i)
                .map(x => x * Math.random())
                .flatMap(x => success(x.toString()))
                .map(s => s.length);
              resolve(result);
            }, Math.random() * 10);
          });
        })
      );

      // All results should be successful despite race conditions
      results.forEach(result => {
        expect((result as any).isSuccess()).toBe(true);
      });
    });
  });

  describe('Pattern Matching Edge Cases', () => {
    it('should handle complex pattern matching scenarios', () => {
      const complexData = {
        type: 'user',
        id: 123,
        profile: {
          name: 'John',
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        }
      };

      const result = success(complexData).match([
        [success, (data: any) => data.type === 'admin', () => 'admin-user'],
        [success, (data: any) => data.type === 'user', (data: any) => `user-${data.id}`],
        [success, () => 'unknown-user'],
        [failure, (error: any) => `error-${error}`]
      ]);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('user-123');
    });

    it('should handle pattern matching with no matches', () => {
      const result = success('test').match([
        [success, (value: string) => value === 'other', () => 'matched'],
        [failure, () => 'failed']
      ]);

      // Should return failure when no pattern matches
      expect(result.isFailure()).toBe(true);
    });

    it('should handle pattern matching with destructuring complex objects', () => {
      const data = {
        user: { name: 'Alice', age: 30 },
        settings: { theme: 'light' }
      };

      const result = success(data).match([
        [success, (data: any) => data.user && data.user.name === 'Alice', (data: any) => `Found Alice: ${data.user.age}`],
        [success, (data: any) => data.user && data.user.name === 'Bob', () => 'Found Bob'],
        [success, () => 'Other user'],
        [failure, (error: any) => `Error: ${error}`]
      ]);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('Found Alice: 30');
    });
  });

  describe('Try/Catch Edge Cases', () => {
    it('should handle nested try/catch operations', () => {
      const result = success('test')
        .try(str => {
          return str.toUpperCase();
        })
        .catch(error => `First catch: ${error}`)
        .try(str => {
          if (str === 'TEST') throw new Error('Intentional error');
          return str;
        })
        .catch(error => `Second catch: ${error}`);

      expect(result.isFailure()).toBe(true);
      expect(() => result.getOrThrow()).toThrow(/Second catch.*Intentional error/);
    });

    it('should handle try/catch with async-like operations', () => {
      const asyncLikeOperation = (value: string) => {
        if (value === 'error') throw new Error('Async error');
        return `Processed: ${value}`;
      };

      const results = ['success', 'error', 'another'].map(value => 
        success(value)
          .try(asyncLikeOperation)
          .catch(error => `Handled: ${error}`)
      );

      expect(results[0].isSuccess()).toBe(true);
      expect(results[0].getOrThrow()).toBe('Processed: success');

      expect(results[1].isFailure()).toBe(true);
      expect(() => results[1].getOrThrow()).toThrow(/Handled.*Async error/);

      expect(results[2].isSuccess()).toBe(true);
      expect(results[2].getOrThrow()).toBe('Processed: another');
    });

    it('should handle try/catch with finally operations', () => {
      let finallyExecuted = false;

      const result = success('test')
        .try(str => {
          throw new Error('Test error');
          return str;
        })
        .finally(() => {
          finallyExecuted = true;
        })
        .catch(error => `Caught: ${error}`);

      expect(finallyExecuted).toBe(true);
      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Integration Edge Cases', () => {
    it('should handle complex integration scenarios', () => {
      const complexWorkflow = (data: any[]) => {
        return map((item: any) => 
          success(item)
            .try(x => {
              if (x.id % 10 === 0) throw new Error(`Error for ${x.id}`);
              return x;
            })
            .catch(error => ({ ...item, error: String(error) }))
            .map(x => ({ ...x, processed: true }))
            .flatMap(x => 
              x.error ? failure(x.error) : success(x)
            )
        )(data)
          .recover(() => [])
          .map(results => results.filter((r: any) => !r.error));
      };

      const testData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
      const result = complexWorkflow(testData);

      expect(result.isSuccess()).toBe(true);
    });

    it('should handle all() with mixed large datasets', () => {
      const mixedResults = Array.from({ length: 50000 }, (_, i) => {
        if (i === 25000) return failure('middle-error');
        return success(i);
      });

      const allResult = all(mixedResults);
      expect(allResult.isFailure()).toBe(true);

      // Test with all successes
      const allSuccesses = Array.from({ length: 10000 }, (_, i) => success(i));
      const allSuccessResult = all(allSuccesses);
      expect(allSuccessResult.isSuccess()).toBe(true);
      expect(allSuccessResult.getOrThrow().length).toBe(10000);
    });
  });
});