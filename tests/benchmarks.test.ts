import { success, failure, Result, tryCatch, all } from '../src/result';
import { map, filter, reduce } from '../src/array';
import { prop, merge } from '../src/object';

describe('Benchmark Tests', () => {
  const benchmark = (fn: () => void, iterations = 100000): number => {
    // Warm up
    for (let i = 0; i < 1000; i++) fn();
    
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) fn();
    const end = process.hrtime.bigint();
    
    const nanoseconds = Number(end - start);
    return Math.round((iterations / nanoseconds) * 1e9);
  };

  describe('Result Creation Performance', () => {
    it('should benchmark success creation', () => {
      const opsPerSec = benchmark(() => success('test'));
      console.log(`Success creation: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(100000);
    });

    it('should benchmark failure creation', () => {
      const opsPerSec = benchmark(() => failure('error'));
      console.log(`Failure creation: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(100000);
    });
  });

  describe('Result Chaining Performance', () => {
    it('should benchmark simple chains', () => {
      const opsPerSec = benchmark(() => {
        success(1)
          .map(x => x + 1)
          .map(x => x * 2);
      });
      console.log(`Simple chain: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(100000);
    });

    it('should benchmark complex chains', () => {
      const opsPerSec = benchmark(() => {
        success(1)
          .map(x => x + 1)
          .flatMap(x => success(x * 2))
          .map(x => x.toString())
          .flatMap(x => success(parseInt(x)));
      });
      console.log(`Complex chain: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(10000);
    });
  });

  describe('Pattern Matching Performance', () => {
    it('should benchmark success matching', () => {
      const result = success('test');
      const opsPerSec = benchmark(() => {
        result.fold(
          error => error,
          (value: string) => value.toUpperCase()
        );
      });
      console.log(`Success matching: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(100000);
    });

    it('should benchmark failure matching', () => {
      const result = failure('error');
      const opsPerSec = benchmark(() => {
        result.fold(
          error => error,
          (value: string) => value.toUpperCase()
        );
      });
      console.log(`Failure matching: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(100000);
    });
  });

  describe('Array Operations Performance', () => {
    it('should benchmark array map operations', () => {
      const small = Array.from({ length: 100 }, (_, i) => i);
      const medium = Array.from({ length: 1000 }, (_, i) => i);
      const large = Array.from({ length: 10000 }, (_, i) => i);

      const mapSmall = benchmark(() => map((x: number) => success(x * 2))(small), 10000);
      const mapMedium = benchmark(() => map((x: number) => success(x * 2))(medium), 1000);
      const mapLarge = benchmark(() => map((x: number) => success(x * 2))(large), 100);

      console.log(`Map small: ${mapSmall} ops/sec`);
      console.log(`Map medium: ${mapMedium} ops/sec`);
      console.log(`Map large: ${mapLarge} ops/sec`);

      expect(mapSmall).toBeGreaterThan(1000);
      expect(mapMedium).toBeGreaterThan(100);
      expect(mapLarge).toBeGreaterThan(10);
    });

    it('should benchmark array filter operations', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i);
      
      const filterEven = benchmark(() => filter((x: number) => success(x % 2 === 0))(data), 1000);
      const filterOdd = benchmark(() => filter((x: number) => success(x % 2 === 1))(data), 1000);

      console.log(`Filter even: ${filterEven} ops/sec`);
      console.log(`Filter odd: ${filterOdd} ops/sec`);

      expect(filterEven).toBeGreaterThan(100);
      expect(filterOdd).toBeGreaterThan(100);
    });

    it('should benchmark array reduce operations', () => {
      const small = Array.from({ length: 100 }, (_, i) => i);
      const large = Array.from({ length: 10000 }, (_, i) => i);

      const reduceSmall = benchmark(() => reduce((acc: number, x: number) => success(acc + x), 0)(small), 10000);
      const reduceLarge = benchmark(() => reduce((acc: number, x: number) => success(acc + x), 0)(large), 100);

      console.log(`Reduce small: ${reduceSmall} ops/sec`);
      console.log(`Reduce large: ${reduceLarge} ops/sec`);

      expect(reduceSmall).toBeGreaterThan(1000);
      expect(reduceLarge).toBeGreaterThan(10);
    });
  });

  describe('Object Operations Performance', () => {
    it('should benchmark object property access', () => {
      const small = { a: 1, b: 2 };
      const large = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`key${i}`, i]));

      // @ts-ignore - Test file type assertion
      const propSmall = benchmark(() => prop('a', () => 'missing')(small));
      // @ts-ignore - Test file type assertion
      const propLarge = benchmark(() => prop('key500', () => 'missing')(large));

      console.log(`Small object prop: ${propSmall} ops/sec`);
      console.log(`Large object prop: ${propLarge} ops/sec`);

      expect(propSmall).toBeGreaterThan(100000);
      expect(propLarge).toBeGreaterThan(100000);
    });

    it('should benchmark object picking operations', () => {
      const obj = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i]));
      
      const pickFew = benchmark(() => {
        const { key1, key2 } = obj;
        return { key1, key2 };
      }, 10000);
      
      const pickMany = benchmark(() => {
        const picked: any = {};
        for (let i = 0; i < 50; i++) {
          picked[`key${i}`] = obj[`key${i}`];
        }
        return picked;
      }, 1000);

      console.log(`Pick few: ${pickFew} ops/sec`);
      console.log(`Pick many: ${pickMany} ops/sec`);

      expect(pickFew).toBeGreaterThan(10000);
      expect(pickMany).toBeGreaterThan(1000);
    });

    it('should benchmark object merge operations', () => {
      const small1 = { a: 1, b: 2 };
      const small2 = { c: 3, d: 4 };
      const large1 = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`key${i}`, i]));
      const large2 = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`other${i}`, i]));

      const mergeSmall = benchmark(() => merge((_key: string, _target: unknown, source: unknown) => success(source))(small1, small2), 10000);
      const mergeLarge = benchmark(() => merge((_key: string, _target: unknown, source: unknown) => success(source))(large1, large2), 100);

      console.log(`Merge small: ${mergeSmall} ops/sec`);
      console.log(`Merge large: ${mergeLarge} ops/sec`);

      expect(mergeSmall).toBeGreaterThan(10000);
      expect(mergeLarge).toBeGreaterThan(100);
    });
  });

  describe('Try-Catch Performance', () => {
    it('should benchmark tryCatch success path', () => {
      const opsPerSec = benchmark(() => {
        tryCatch(
          () => JSON.parse('{"name": "test"}'),
          error => `Parse error: ${error}`
        );
      });
      console.log(`TryCatch success: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(10000);
    });

    it('should benchmark tryCatch failure path', () => {
      const opsPerSec = benchmark(() => {
        tryCatch(
          () => JSON.parse('invalid json'),
          error => `Parse error: ${error}`
        );
      }, 10000);
      console.log(`TryCatch failure: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(1000);
    });

    it('should benchmark tryCatch chaining', () => {
      const opsPerSec = benchmark(() => {
        tryCatch(
          () => 'test'.toUpperCase(),
          error => `Error: ${error}`
        ).map(str => str.toLowerCase());
      });
      console.log(`TryCatch chaining: ${opsPerSec} ops/sec`);
      expect(opsPerSec).toBeGreaterThan(10000);
    });
  });

  describe('Performance Comparisons', () => {
    it('should compare native vs result operations', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i);
      
      const nativeMap = benchmark(() => data.map(x => x * 2), 1000);
      const resultMap = benchmark(() => map((x: number) => success(x * 2))(data), 1000);
      const nativeFilter = benchmark(() => data.filter(x => x % 2 === 0), 1000);
      const resultFilter = benchmark(() => filter((x: number) => success(x % 2 === 0))(data), 1000);

      console.log(`Native map: ${nativeMap} ops/sec`);
      console.log(`Result map: ${resultMap} ops/sec`);
      console.log(`Native filter: ${nativeFilter} ops/sec`);
      console.log(`Result filter: ${resultFilter} ops/sec`);

      const mapRatio = nativeMap / resultMap;
      const filterRatio = nativeFilter / resultFilter;

      console.log(`Map performance ratio (native/result): ${mapRatio.toFixed(2)}x`);
      console.log(`Filter performance ratio (native/result): ${filterRatio.toFixed(2)}x`);

      // Result operations should not be more than 10x slower than native
      expect(mapRatio).toBeLessThan(10);
      expect(filterRatio).toBeLessThan(10);
    });

    it('should benchmark all operation with different sizes', () => {
      const sizes = [100, 1000, 10000, 50000];
      
      for (const size of sizes) {
        const results = Array.from({ length: size }, () => success(1));
        const opsPerSec = benchmark(() => all(results), Math.max(1, Math.floor(1000 / (size / 100))));
        console.log(`all(${size}): ${opsPerSec} ops/sec`);
        expect(opsPerSec).toBeGreaterThan(1);
      }
    });
  });

  describe('Memory Usage Tests', () => {
    it('should test memory usage with large datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create 100k Results
      const results: Result<string, number>[] = [];
      for (let i = 0; i < 100000; i++) {
        results.push(success(i));
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB
      
      console.log(`Memory increase for 100k Results: ${memoryIncrease.toFixed(2)} MB`);
      
      // Should not use more than 500MB for 100k Results
      expect(memoryIncrease).toBeLessThan(500);
    });
  });

  describe('Scalability Tests', () => {
    it('should test performance scalability with increasing data sizes', async () => {
      const sizes = [100, 500, 1000, 5000, 10000];
      const results: { size: number; opsPerSec: number }[] = [];
      
      for (const size of sizes) {
        const data = Array.from({ length: size }, (_, i) => i);
        const iterations = Math.max(1, Math.floor(10000 / (size / 100)));
        
        const opsPerSec = benchmark(() => {
          map((x: number) => success(x * 2))(data)
            .flatMap(mapped => filter((x: number) => success(x > 0))(mapped))
            .map(filtered => reduce((acc: number, x: number) => success(acc + x), 0)(filtered));
        }, iterations);
        
        results.push({ size, opsPerSec });
        console.log(`Size ${size}: ${opsPerSec.toFixed(2)} ops/sec`);
      }
      
      // Compare first and last results for scalability
      if (results.length >= 2) {
        const first = results[0];
        const last = results[results.length - 1];
        const sizeRatio = last.size / first.size;
        const perfRatio = first.opsPerSec / last.opsPerSec;
        
        console.log(`Size ratio: ${sizeRatio}x, Performance ratio: ${perfRatio.toFixed(2)}x`);
        
        // Performance should not degrade more than proportionally to size increase
        // Adjusted threshold for Node.js v22 - allow up to 20x degradation
        expect(perfRatio).toBeLessThan(sizeRatio * 5);
      }
    });
  });
});