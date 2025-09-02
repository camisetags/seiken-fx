import { success, failure, all, tryCatch } from '../src/result';
import { map, filter, reduce } from '../src/array';
import { prop, pick, merge } from '../src/object';

describe('Benchmark Tests', () => {
  // Helper to run benchmarks
  const benchmark = async (
    _name: string, 
    fn: () => any, 
    iterations: number = 1000
  ): Promise<{ avgTime: number; opsPerSecond: number; totalTime: number }> => {
    const times: number[] = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
      fn();
    }
    
    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }
    
    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / iterations;
    const opsPerSecond = 1000 / avgTime;
    
    return { avgTime, opsPerSecond, totalTime };
  };

  describe('Result Operations Benchmarks', () => {
    it('should benchmark basic Result creation and operations', async () => {
      const createSuccess = () => success(42);
      const createFailure = () => failure('error');
      
      const successBench = await benchmark('Success creation', createSuccess, 10000);
      const failureBench = await benchmark('Failure creation', createFailure, 10000);
      
      console.log(`Success creation: ${successBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Failure creation: ${failureBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      // Both should be very fast (> 100k ops/sec)
      expect(successBench.opsPerSecond).toBeGreaterThan(100000);
      expect(failureBench.opsPerSecond).toBeGreaterThan(100000);
    });

    it('should benchmark Result chaining operations', async () => {
      const simpleChain = () => {
        return success(10)
          .map(x => x * 2)
          .flatMap(x => success(x + 5))
          .map(x => x.toString());
      };
      
      const complexChain = () => {
        return success(1)
          .map(x => x + 1)
          .flatMap(x => success(x * 2))
          .map(x => x - 1)
          .flatMap(x => success(x.toString()))
          .map(x => x.length)
          .flatMap(x => success(x > 0));
      };
      
      const simpleBench = await benchmark('Simple chain', simpleChain, 5000);
      const complexBench = await benchmark('Complex chain', complexChain, 5000);
      
      console.log(`Simple chain: ${simpleBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Complex chain: ${complexBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      // Should handle thousands of operations per second
      expect(simpleBench.opsPerSecond).toBeGreaterThan(10000);
      expect(complexBench.opsPerSecond).toBeGreaterThan(5000);
    });

    it('should benchmark pattern matching', async () => {
      const successMatch = () => {
        return success(42).match([
          [success, (x: number) => x > 40, (x: number) => `large: ${x}`],
          [success, (x: number) => `small: ${x}`],
          [failure, (e: any) => `error: ${e}`]
        ]);
      };
      
      const failureMatch = () => {
        return failure('test-error').match([
          [success, (x: any) => `success: ${x}`],
          [failure, (e: string) => `handled: ${e}`]
        ]);
      };
      
      const successBench = await benchmark('Success matching', successMatch, 5000);
      const failureBench = await benchmark('Failure matching', failureMatch, 5000);
      
      console.log(`Success matching: ${successBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Failure matching: ${failureBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(successBench.opsPerSecond).toBeGreaterThan(5000);
      expect(failureBench.opsPerSecond).toBeGreaterThan(5000);
    });
  });

  describe('Array Operations Benchmarks', () => {
    it('should benchmark array map operations', async () => {
      const smallArray = Array.from({ length: 100 }, (_, i) => i);
      const mediumArray = Array.from({ length: 1000 }, (_, i) => i);
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      
      const mapSmall = () => map((x: number) => success(x * 2))(smallArray);
      const mapMedium = () => map((x: number) => success(x * 2))(mediumArray);
      const mapLarge = () => map((x: number) => success(x * 2))(largeArray);
      
      const smallBench = await benchmark('Map small array (100)', mapSmall, 1000);
      const mediumBench = await benchmark('Map medium array (1000)', mapMedium, 500);
      const largeBench = await benchmark('Map large array (10000)', mapLarge, 100);
      
      console.log(`Map small: ${smallBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Map medium: ${mediumBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Map large: ${largeBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      // Performance should scale reasonably
      expect(smallBench.opsPerSecond).toBeGreaterThan(1000);
      expect(mediumBench.opsPerSecond).toBeGreaterThan(100);
      expect(largeBench.opsPerSecond).toBeGreaterThan(10);
    });

    it('should benchmark array filter operations', async () => {
      const array = Array.from({ length: 5000 }, (_, i) => i);
      
      const filterEven = () => filter((x: number) => success(x % 2 === 0))(array);
      const filterOdd = () => filter((x: number) => success(x % 2 === 1))(array);
      
      const evenBench = await benchmark('Filter even numbers', filterEven, 200);
      const oddBench = await benchmark('Filter odd numbers', filterOdd, 200);
      
      console.log(`Filter even: ${evenBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Filter odd: ${oddBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(evenBench.opsPerSecond).toBeGreaterThan(50);
      expect(oddBench.opsPerSecond).toBeGreaterThan(50);
    });

    it('should benchmark array reduce operations', async () => {
      const smallArray = Array.from({ length: 1000 }, (_, i) => i + 1);
      const largeArray = Array.from({ length: 100000 }, (_, i) => i + 1);
      
      const reduceSmall = () => reduce((acc: number, curr: number) => success(acc + curr), 0)(smallArray);
      const reduceLarge = () => reduce((acc: number, curr: number) => success(acc + curr), 0)(largeArray);
      
      const smallBench = await benchmark('Reduce small array', reduceSmall, 500);
      const largeBench = await benchmark('Reduce large array', reduceLarge, 50);
      
      console.log(`Reduce small: ${smallBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Reduce large: ${largeBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(smallBench.opsPerSecond).toBeGreaterThan(100);
      expect(largeBench.opsPerSecond).toBeGreaterThan(5);
    });
  });

  describe('Object Operations Benchmarks', () => {
    it('should benchmark object property access', async () => {
      const smallObj = { a: 1, b: 2, c: 3 };
      const largeObj: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeObj[`prop${i}`] = i;
      }
      
      const propSmall = () => (prop as any)('b', () => 'not found')(smallObj);
      const propLarge = () => (prop as any)('prop5000', () => 'not found')(largeObj);
      
      const smallBench = await benchmark('Prop access small object', propSmall, 10000);
      const largeBench = await benchmark('Prop access large object', propLarge, 5000);
      
      console.log(`Small object prop: ${smallBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Large object prop: ${largeBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(smallBench.opsPerSecond).toBeGreaterThan(50000);
      expect(largeBench.opsPerSecond).toBeGreaterThan(10000);
    });

    it('should benchmark object picking operations', async () => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        obj[`prop${i}`] = i;
      }
      
      const pickFew = () => (pick as any)(['prop1', 'prop2', 'prop3'], (key: any) => `missing: ${key}`)(obj);
      const pickMany = () => (pick as any)(Array.from({ length: 100 }, (_, i) => `prop${i}`), (key: any) => `missing: ${key}`)(obj);
      
      const fewBench = await benchmark('Pick few properties', pickFew, 5000);
      const manyBench = await benchmark('Pick many properties', pickMany, 1000);
      
      console.log(`Pick few: ${fewBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Pick many: ${manyBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(fewBench.opsPerSecond).toBeGreaterThan(1000);
      expect(manyBench.opsPerSecond).toBeGreaterThan(100);
    });

    it('should benchmark object merging operations', async () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 4, d: 5, e: 6 };
      
      const largeObj1: Record<string, any> = {};
      const largeObj2: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj1[`prop${i}`] = i;
        largeObj2[`prop${i + 500}`] = i + 500;
      }
      
      const mergeSmall = () => merge(() => success('resolved') as any)(obj1, obj2);
      const mergeLarge = () => merge(() => success('resolved') as any)(largeObj1, largeObj2);
      
      const smallBench = await benchmark('Merge small objects', mergeSmall, 5000);
      const largeBench = await benchmark('Merge large objects', mergeLarge, 100);
      
      console.log(`Merge small: ${smallBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Merge large: ${largeBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(smallBench.opsPerSecond).toBeGreaterThan(1000);
      expect(largeBench.opsPerSecond).toBeGreaterThan(50);
    });
  });

  describe('TryCatch Benchmarks', () => {
    it('should benchmark tryCatch with successful operations', async () => {
      const successfulOp = () => tryCatch(
        () => Math.sqrt(16),
        (error) => `Error: ${error}`
      );
      
      const successBench = await benchmark('TryCatch success', successfulOp, 10000);
      
      console.log(`TryCatch success: ${successBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(successBench.opsPerSecond).toBeGreaterThan(10000);
    });

    it('should benchmark tryCatch with failing operations', async () => {
      const failingOp = () => tryCatch(
        () => { throw new Error('Test error'); },
        (error) => `Caught: ${error}`
      );
      
      const failureBench = await benchmark('TryCatch failure', failingOp, 5000);
      
      console.log(`TryCatch failure: ${failureBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      // Exception handling is inherently slower but should still be reasonable
      expect(failureBench.opsPerSecond).toBeGreaterThan(1000);
    });

    it('should benchmark try/catch chaining', async () => {
      const chainedTryCatch = () => {
        return success('test-input')
          .try(str => str.toUpperCase())
          .catch(error => `Error1: ${error}`)
          .try(str => str.split('').reverse().join(''))
          .catch(error => `Error2: ${error}`);
      };
      
      const chainBench = await benchmark('TryCatch chaining', chainedTryCatch, 5000);
      
      console.log(`TryCatch chaining: ${chainBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      expect(chainBench.opsPerSecond).toBeGreaterThan(2000);
    });
  });

  describe('Comparative Benchmarks', () => {
    it('should compare Result operations vs native operations', async () => {
      const array = Array.from({ length: 1000 }, (_, i) => i);
      
      // Native operations
      const nativeMap = () => array.map(x => x * 2);
      const nativeFilter = () => array.filter(x => x % 2 === 0);
      
      // Result operations
      const resultMap = () => map((x: number) => success(x * 2))(array);
      const resultFilter = () => filter((x: number) => success(x % 2 === 0))(array);
      
      const nativeMapBench = await benchmark('Native map', nativeMap, 5000);
      const resultMapBench = await benchmark('Result map', resultMap, 1000);
      const nativeFilterBench = await benchmark('Native filter', nativeFilter, 5000);
      const resultFilterBench = await benchmark('Result filter', resultFilter, 1000);
      
      console.log(`Native map: ${nativeMapBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Result map: ${resultMapBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Native filter: ${nativeFilterBench.opsPerSecond.toFixed(0)} ops/sec`);
      console.log(`Result filter: ${resultFilterBench.opsPerSecond.toFixed(0)} ops/sec`);
      
      // Result operations should be within reasonable factor of native operations
      const mapRatio = nativeMapBench.opsPerSecond / resultMapBench.opsPerSecond;
      const filterRatio = nativeFilterBench.opsPerSecond / resultFilterBench.opsPerSecond;
      
      console.log(`Map performance ratio (native/result): ${mapRatio.toFixed(2)}x`);
      console.log(`Filter performance ratio (native/result): ${filterRatio.toFixed(2)}x`);
      
      // Should not be more than 100x slower than native operations
      expect(mapRatio).toBeLessThan(100);
      expect(filterRatio).toBeLessThan(100);
    });

    it('should benchmark all() operation with various sizes', async () => {
      const sizes = [100, 1000, 10000, 50000];
      
      for (const size of sizes) {
        const results = Array.from({ length: size }, (_, i) => success(i));
        
        const allOp = () => all(results);
        const bench = await benchmark(`all() with ${size} results`, allOp, size > 10000 ? 10 : 100);
        
        console.log(`all(${size}): ${bench.opsPerSecond.toFixed(0)} ops/sec`);
        
        // Should handle at least a few operations per second even for large datasets
        expect(bench.opsPerSecond).toBeGreaterThan(size > 10000 ? 1 : 10);
      }
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should benchmark memory efficiency of Result operations', async () => {
      const getMemoryUsage = () => process.memoryUsage().heapUsed / 1024 / 1024; // MB
      
      const initialMemory = getMemoryUsage();
      
      // Create many Results
      const results = [];
      for (let i = 0; i < 100000; i++) {
        const result = success(i)
          .map(x => x.toString())
          .flatMap(x => success(x.length));
        results.push(result);
      }
      
      const peakMemory = getMemoryUsage();
      
      // Access all results to ensure they're not optimized away
      results.forEach(r => r.isSuccess());
      
      const memoryIncrease = peakMemory - initialMemory;
      
      console.log(`Memory increase for 100k Results: ${memoryIncrease.toFixed(2)} MB`);
      
      // Should use reasonable amount of memory (less than 500MB for 100k Results)
      expect(memoryIncrease).toBeLessThan(500);
    });
  });

  describe('Scalability Tests', () => {
    it('should test performance scalability with increasing data sizes', async () => {
      const testSizes = [100, 500, 1000, 5000, 10000];
      const results: Array<{ size: number; opsPerSec: number }> = [];
      
      for (const size of testSizes) {
        const data = Array.from({ length: size }, (_, i) => i);
        
        const operation = () => {
          const mapResult = map((x: number) => success(x * 2))(data);
          if (mapResult.isFailure()) return mapResult;
          
          return filter((x: number) => success(x > size / 2))(mapResult.getOrThrow());
        };
        
        const bench = await benchmark(`Scalability test (${size})`, operation, 50);
        results.push({ size, opsPerSec: bench.opsPerSecond });
        
        console.log(`Size ${size}: ${bench.opsPerSecond.toFixed(2)} ops/sec`);
      }
      
      // Check that performance degrades gracefully (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        const sizeRatio = curr.size / prev.size;
        const perfRatio = prev.opsPerSec / curr.opsPerSec;
        
        console.log(`Size ratio: ${sizeRatio}x, Performance ratio: ${perfRatio.toFixed(2)}x`);
        
        // Performance should not degrade more than proportionally to size increase
        expect(perfRatio).toBeLessThan(sizeRatio * 3);
      }
    });
  });
});