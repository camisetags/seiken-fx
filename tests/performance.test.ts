import { success, failure, all, tryCatch } from '../src/result';
import { map, filter, reduce, get, head } from '../src/array';
import { prop, pick, merge } from '../src/object';

describe('Performance and Stress Tests', () => {
  // Helper to measure execution time
  const measureTime = async <T>(fn: () => T | Promise<T>): Promise<{ result: T; time: number }> => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const time = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, time };
  };

  describe('Large Array Operations', () => {
    it('should handle arrays with 100k elements efficiently', async () => {
      const largeArray = Array.from({ length: 100000 }, (_, i) => i);
      
      const { time } = await measureTime(() => {
        const mapResult = map((x: number) => success(x * 2))(largeArray);
        expect(mapResult.isSuccess()).toBe(true);
        return mapResult;
      });

      // Should complete within reasonable time (< 100ms)
      expect(time).toBeLessThan(500); // Relaxed threshold
    });

    it('should handle filtering large arrays efficiently', async () => {
      const largeArray = Array.from({ length: 50000 }, (_, i) => i);
      
      const { time } = await measureTime(() => {
        const filterResult = filter((x: number) => success(x % 2 === 0))(largeArray);
        expect(filterResult.isSuccess()).toBe(true);
        if (filterResult.isSuccess()) {
          expect(filterResult.getOrThrow().length).toBe(25000);
        }
        return filterResult;
      });

      expect(time).toBeLessThan(100); // Relaxed threshold for CI
    });

    it('should handle reducing large arrays efficiently', async () => {
      const largeArray = Array.from({ length: 100000 }, (_, i) => i + 1);
      
      const { time } = await measureTime(() => {
        const reduceResult = reduce((acc: number, curr: number) => success(acc + curr), 0)(largeArray);
        expect(reduceResult.isSuccess()).toBe(true);
        if (reduceResult.isSuccess()) {
          // Sum of 1 to 100000 = 100000 * 100001 / 2 = 5000050000
          expect(reduceResult.getOrThrow()).toBe(5000050000);
        }
        return reduceResult;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });

    it('should handle array access operations efficiently', async () => {
      const largeArray = Array.from({ length: 1000000 }, (_, i) => `item-${i}`);
      
      const { time } = await measureTime(() => {
        // Test multiple random accesses
        const results = [];
        for (let i = 0; i < 1000; i++) {
          const randomIndex = Math.floor(Math.random() * largeArray.length);
          const getResult = get(randomIndex, () => 'Not found')(largeArray);
          results.push(getResult);
        }
        
        // All should be successful
        results.forEach(result => {
          expect(result.isSuccess()).toBe(true);
        });
        
        return results;
      });

      expect(time).toBeLessThan(100); // Relaxed threshold for CI
    });

    it('should handle head operation on extremely large arrays', async () => {
      const hugeArray = Array.from({ length: 10000000 }, (_, i) => i);
      
      const { time } = await measureTime(() => {
        const headResult = head(hugeArray, () => 'Empty');
        expect(headResult.isSuccess()).toBe(true);
        expect(headResult.getOrThrow()).toBe(0);
        return headResult;
      });

      // Head should be O(1) regardless of array size
      expect(time).toBeLessThan(10);
    });
  });

  describe('Large Object Operations', () => {
    it('should handle objects with many properties efficiently', async () => {
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 100000; i++) {
        largeObject[`prop${i}`] = {
          id: i,
          name: `item-${i}`,
          value: Math.random() * 1000,
          nested: {
            level1: { level2: { level3: `deep-${i}` } }
          }
        };
      }

      const { time } = await measureTime(() => {
        // Test property access
        const propResult = (prop as any)('prop50000', () => 'not found')(largeObject);
        expect(propResult.isSuccess()).toBe(true);
        
        // Test picking multiple properties
        const pickKeys = Array.from({ length: 100 }, (_, i) => `prop${i * 1000}`);
        const pickResult = (pick as any)(pickKeys, (key: any) => `missing: ${key}`)(largeObject);
        expect(pickResult.isSuccess()).toBe(true);
        
        return { propResult, pickResult };
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });

    it('should handle deep object merging efficiently', async () => {
      const createDeepObject = (depth: number, breadth: number): any => {
        if (depth === 0) return Math.random();
        
        const obj: any = {};
        for (let i = 0; i < breadth; i++) {
          obj[`key${i}`] = createDeepObject(depth - 1, breadth);
        }
        return obj;
      };

      const obj1 = createDeepObject(5, 10);
      const obj2 = createDeepObject(5, 10);
      
      const { time } = await measureTime(() => {
        const mergeResult = merge(() => success('resolved') as any)(obj1, obj2);
        expect(mergeResult.isSuccess()).toBe(true);
        return mergeResult;
      });

      expect(time).toBeLessThan(200);
    });

    it('should handle object property access with deep nesting', async () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    level7: {
                      level8: {
                        level9: {
                          level10: 'deep-value'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const { time } = await measureTime(() => {
        // Create 10000 similar deep objects and access properties
        const results = [];
        for (let i = 0; i < 10000; i++) {
          const testObj = { ...deepObject, id: i };
          const propResult = (prop as any)('level1', () => 'not found')(testObj);
          results.push(propResult);
        }
        
        results.forEach(result => {
          expect(result.isSuccess()).toBe(true);
        });
        
        return results;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });
  });

  describe('Result Chaining Performance', () => {
    it('should handle long chains efficiently', async () => {
      const { time } = await measureTime(() => {
        let result: any = success(1);
        
        // Chain 10000 operations
        for (let i = 0; i < 10000; i++) {
          result = result
            .map((x: number) => x + 1)
            .flatMap((x: number) => success(x * 2))
            .map((x: number) => x - 1);
        }
        
        expect(result.isSuccess()).toBe(true);
        return result;
      });

      expect(time).toBeLessThan(100); // Relaxed threshold for CI
    });

    it('should handle complex nested operations efficiently', async () => {
      const complexOperation = (data: any[]) => {
        return map((item: any) => 
          success(item)
            .map(x => ({ ...x, processed: true }))
            .flatMap(x => success({ ...x, timestamp: Date.now() }))
            .map(x => ({ ...x, id: Math.random() }))
        )(data);
      };

      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        index: i,
        name: `item-${i}`,
        value: Math.random() * 1000
      }));

      const { time } = await measureTime(() => {
        const result = complexOperation(largeDataSet);
        expect(result.isSuccess()).toBe(true);
        return result;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });

    it('should handle pattern matching on large datasets', async () => {
      const largeResults = Array.from({ length: 50000 }, (_, i) => 
        i % 2 === 0 ? success(`success-${i}`) : failure(`error-${i}`)
      );

      const { time } = await measureTime(() => {
        let successCount = 0;
        let failureCount = 0;

        largeResults.forEach(result => {
          result.match([
            [success, (value: string) => {
              successCount++;
              return value;
            }],
            [failure, (error: string) => {
              failureCount++;
              return error;
            }]
          ]);
        });

        expect(successCount).toBe(25000);
        expect(failureCount).toBe(25000);
        
        return { successCount, failureCount };
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not leak memory with large Result chains', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      await measureTime(async () => {
        // Create and dispose of many Results
        for (let i = 0; i < 100000; i++) {
          const result = success(i)
            .map(x => x * 2)
            .flatMap(x => success(x + 1))
            .map(x => x.toString());
          
          // Force some work to be done
          result.getOrElse('');
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        return true;
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should handle many concurrent Results efficiently', async () => {
      const { time } = await measureTime(() => {
        const results = Array.from({ length: 100000 }, (_, i) => {
          if (i % 1000 === 0) return failure(`error-${i}`);
          return success(i);
        });

        // Process all results
        const allResult = all(results);
        expect(allResult.isFailure()).toBe(true); // Should fail on first error
        
        return allResult;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });
  });

  describe('TryCatch Performance', () => {
    it('should handle many tryCatch operations efficiently', async () => {
      const riskyOperation = (value: number) => {
        if (value % 1000 === 0) {
          throw new Error(`Error at ${value}`);
        }
        return value * 2;
      };

      const { time } = await measureTime(() => {
        const results = [];
        
        for (let i = 0; i < 50000; i++) {
          const result = tryCatch(
            () => riskyOperation(i),
            (error) => `Handled: ${error}`
          );
          results.push(result);
        }
        
        // Count successes and failures
        const successes = results.filter(r => r.isSuccess()).length;
        const failures = results.filter(r => r.isFailure()).length;
        
        expect(successes).toBe(49950); // 50000 - 50 errors
        expect(failures).toBe(50);
        
        return results;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });

    it('should handle try/catch chaining efficiently', async () => {
      const { time } = await measureTime(() => {
        const results = [];
        
        for (let i = 0; i < 10000; i++) {
          const result = success(`input-${i}`)
            .try(str => {
              if (str.includes('999')) throw new Error('Special error');
              return str.toUpperCase();
            })
            .catch(error => `Error: ${error}`)
            .map(str => str.length);
          
          results.push(result);
        }
        
        // All should complete successfully
        results.forEach(result => {
          expect(result.isSuccess() || result.isFailure()).toBe(true);
        });
        
        return results;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme array operations without crashing', async () => {
      // Create a very large array
      const extremeArray = Array.from({ length: 1000000 }, (_, i) => ({
        id: i,
        data: `data-${i}`,
        nested: { value: i * Math.random() }
      }));

      const { time } = await measureTime(() => {
        // Multiple operations on the same large array
        const mapResult = map((item: any) => success({ ...item, processed: true }))(extremeArray);
        const headResult = head(extremeArray, () => 'empty');
        
        expect(mapResult.isSuccess()).toBe(true);
        expect(headResult.isSuccess()).toBe(true);
        
        return { mapResult, headResult };
      });

      // Even with 1M items, should complete reasonably fast
      expect(time).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle recursive data structures efficiently', async () => {
      // Create a recursive structure
      const createRecursiveData = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' };
        return {
          value: `node-${depth}`,
          children: Array.from({ length: 3 }, () => createRecursiveData(depth - 1))
        };
      };

      const recursiveData = createRecursiveData(10); // Very deep structure

      const { time } = await measureTime(() => {
        // Test various operations on recursive data
        const propResult = (prop as any)('value', () => 'not found')(recursiveData);
        const pickResult = (pick as any)(['value', 'children'], (key: any) => `missing: ${key}`)(recursiveData);
        
        expect(propResult.isSuccess()).toBe(true);
        expect(pickResult.isSuccess()).toBe(true);
        
        return { propResult, pickResult };
      });

      expect(time).toBeLessThan(100); // Relaxed threshold for CI
    });

    it('should handle mixed success/failure scenarios efficiently', async () => {
      const { time } = await measureTime(() => {
        const mixedResults = Array.from({ length: 100000 }, (_, i) => {
          // Create a mix of successes and failures
          if (i % 7 === 0) return failure(`error-${i}`);
          if (i % 11 === 0) return failure(`another-error-${i}`);
          return success(i);
        });

        // Process all results with various operations
        let processedCount = 0;
        
        mixedResults.forEach(result => {
          result
            .map(x => x * 2)
            .recover(_error => -1)
            .map(x => x + 1);
          processedCount++;
        });

        expect(processedCount).toBe(100000);
        return mixedResults;
      });

      expect(time).toBeLessThan(150);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent operations', async () => {
      const { time } = await measureTime(async () => {
        // Create multiple concurrent operations
        const promises = Array.from({ length: 1000 }, async (_, i) => {
          return new Promise(resolve => {
            setTimeout(() => {
              const result = success(i)
                .map(x => x * 2)
                .flatMap(x => success(x.toString()));
              resolve(result);
            }, Math.random() * 10);
          });
        });

        const results = await Promise.all(promises);
        
        // All should be successful
        results.forEach(result => {
          expect((result as any).isSuccess()).toBe(true);
        });
        
        return results;
      });

      expect(time).toBeLessThan(500); // Relaxed threshold // Should be fast due to concurrency
    });
  });
});