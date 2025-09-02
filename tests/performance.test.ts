import { success, failure, all } from '../src/result';
import { map, filter, reduce, head, tail, get } from '../src/array';
import { prop, pick, merge } from '../src/object';

describe('Performance Tests', () => {
  // Detect CI environment and adjust thresholds accordingly
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const performanceMultiplier = isCI ? 0.5 : 1; // Reduce thresholds in CI by 50%

  const adjustThreshold = (threshold: number): number => {
    return Math.floor(threshold * performanceMultiplier);
  };

  describe('Core Result Operations', () => {
    it('should perform Result creation efficiently', () => {
      const iterations = 100000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        success(i);
        failure(`error-${i}`);
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round((iterations * 2) / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(100000));
    });

    it('should perform Result chaining efficiently', () => {
      const iterations = 10000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        success(i)
          .map(x => x * 2)
          .flatMap(x => success(x + 1))
          .map(x => x.toString())
          .flatMap(x => success(parseInt(x)));
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round(iterations / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(10000));
    });
  });

  describe('Array Operations Performance', () => {
    it('should handle large array operations', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const start = Date.now();
      
      const result = map((x: number) => success(x * 2))(largeArray)
        .flatMap(mapped => filter((x: number) => success(x > 5000))(mapped))
        .map(filtered => reduce((acc: number, x: number) => success(acc + x), 0)(filtered));
      
      const end = Date.now();
      const duration = end - start;
      
      expect(result.isSuccess()).toBe(true);
      expect(duration).toBeLessThan(isCI ? 2000 : 1000); // Allow 2s in CI, 1s locally
    });

    it('should handle array access operations efficiently', () => {
      const array = Array.from({ length: 1000 }, (_, i) => i);
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        head(array, () => 'empty');
        tail(array);
        get(i % array.length, () => 'missing')(array);
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round((iterations * 3) / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(50000));
    });
  });

  describe('Object Operations Performance', () => {
    it('should handle object operations efficiently', () => {
      const obj = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`key${i}`, i]));
      const iterations = 10000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        // @ts-ignore - Test file type assertion
        prop(`key${i % 100}`, () => 'missing')(obj);
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round(iterations / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(100000));
    });

    it('should handle object transformations', () => {
      const obj1 = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`key${i}`, i]));
      const obj2 = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`other${i}`, i]));
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        merge((_key: string, _target: unknown, source: unknown) => success(source))(obj1, obj2);
        pick(['key1', 'key2', 'key3'] as any, () => 'missing')(obj1);
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round((iterations * 2) / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(10000));
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 10000; i++) {
        const result = success(i)
          .map(x => x * 2)
          .flatMap(x => success(x.toString()))
          .map(x => parseInt(x));
        
        if (result.isSuccess()) {
          result.getOrThrow();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      
      // Should not increase memory by more than 50MB for 10k operations
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Stress Tests', () => {
    it('should handle deeply nested operations', () => {
      const start = Date.now();
      let result = success(0);
      
      // Chain 1000 operations
      for (let i = 0; i < 1000; i++) {
        result = result.flatMap(x => success(x + 1));
      }
      
      const end = Date.now();
      const duration = end - start;
      
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(1000);
      expect(duration).toBeLessThan(isCI ? 1000 : 500); // Allow 1s in CI, 500ms locally
    });

    it('should handle all() with large arrays of Results', () => {
      const sizes = [1000, 5000, 10000];
      
      for (const size of sizes) {
        const results = Array.from({ length: size }, (_, i) => success(i));
        const start = Date.now();
        
        const combined = all(results);
        
        const end = Date.now();
        const duration = end - start;
        
        expect(combined.isSuccess()).toBe(true);
        expect(combined.getOrThrow()).toHaveLength(size);
        
        // Should complete within reasonable time based on size
        const expectedMaxTime = isCI ? size * 2 : size; // 2ms per item in CI, 1ms locally
        expect(duration).toBeLessThan(expectedMaxTime);
      }
    });

    it('should handle mixed success/failure scenarios efficiently', () => {
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = i % 2 === 0 ? success(i) : failure(`error-${i}`);
        
        result
          .map(x => x * 2)
          .fold(
            error => `Failed: ${error}`,
            value => `Success: ${value}`
          );
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round(iterations / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(10000));
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle data processing pipeline efficiently', () => {
      const rawData = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        value: Math.random() * 1000,
        category: i % 10
      }));
      
      const start = Date.now();
      
      const processed = map((item: any) => ({
        ...item,
        doubled: item.value * 2
      }))(rawData)
        .flatMap(items => filter((item: any) => success(item.doubled > 500))(items))
        .map(filtered => reduce((acc: number, item: any) => acc + item.doubled, 0)(filtered));
      
      const end = Date.now();
      const duration = end - start;
      
      expect(processed.isSuccess()).toBe(true);
      expect(typeof processed.getOrThrow()).toBe('number');
      expect(duration).toBeLessThan(isCI ? 1000 : 500); // Allow 1s in CI, 500ms locally
    });

    it('should handle error recovery patterns efficiently', () => {
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = failure(`initial-error-${i}`)
          .recover(error => `recovered-from-${error}`)
          .map(value => value.toUpperCase())
          .map(value => value.length);
        
        expect(result.isSuccess()).toBe(true);
      }
      
      const end = Date.now();
      const duration = end - start;
      const opsPerSec = Math.round(iterations / (duration / 1000));
      
      expect(opsPerSec).toBeGreaterThan(adjustThreshold(5000));
    });
  });
});