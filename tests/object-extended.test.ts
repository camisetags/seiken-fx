import { success, failure } from '../src/result';
import {
  mapValues,
  has,
  filterValues,
  compact,
  isObjectEmpty,
  merge,
  defaults,
  keys,
  values,
  entries,
  clone,
} from '../src/object';

describe('Extended object utilities', () => {
  describe('mapValues', () => {
    const testObj = { a: 1, b: 2, c: 3 };

    it('should transform all values successfully', () => {
      const doubleValues = mapValues(
        (value: number) => success(value * 2),
        (error: string, key) => `Error at ${String(key)}: ${error}`,
      );
      const result = doubleValues(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ a: 2, b: 4, c: 6 });
    });

    it('should fail when transformation fails', () => {
      const failOnB = mapValues(
        (value: number, key) => (key === 'b' ? failure('Failed on B') : success(value * 2)),
        (error: string, key) => `Error at ${String(key)}: ${error}`,
      );
      const result = failOnB(testObj);

      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Error at b: Failed on B');
    });

    it('should handle empty object', () => {
      const mapEmpty = mapValues(
        (value: number) => success(value * 2),
        () => 'Error',
      );
      const result = mapEmpty({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({});
    });
  });

  describe('has', () => {
    const testObj = { name: 'John', age: undefined };

    it('should return true for existing property', () => {
      const hasName = has('name');
      const result = hasName(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toBe(true);
    });

    it('should return true for property with undefined value', () => {
      const hasAge = has('age');
      const result = hasAge(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toBe(true);
    });

    it('should return false for non-existent property', () => {
      const hasInvalid = has('invalid');
      const result = hasInvalid(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toBe(false);
    });
  });

  describe('filterValues', () => {
    const testObj = { a: 1, b: 2, c: 3, d: 4 };

    it('should filter values successfully', () => {
      const filterEven = filterValues(
        (value: number) => success(value % 2 === 0),
        (error: string, key) => `Error at ${String(key)}: ${error}`,
      );
      const result = filterEven(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ b: 2, d: 4 });
    });

    it('should fail when predicate fails', () => {
      const failOnC = filterValues(
        (value: number, key) => (key === 'c' ? failure('Failed on C') : success(value % 2 === 0)),
        (error: string, key) => `Error at ${String(key)}: ${error}`,
      );
      const result = failOnC(testObj);

      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Error at c: Failed on C');
    });

    it('should handle empty object', () => {
      const filterEmpty = filterValues(
        () => success(true),
        () => 'Error',
      );
      const result = filterEmpty({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({});
    });
  });

  describe('compact', () => {
    it('should remove null and undefined values', () => {
      const testObj = { a: 1, b: null, c: undefined, d: 'hello', e: 0 };
      const compactObj = compact();
      const result = compactObj(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ a: 1, d: 'hello', e: 0 });
    });

    it('should handle object with no null/undefined values', () => {
      const testObj = { a: 1, b: 'hello', c: true };
      const compactObj = compact();
      const result = compactObj(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual(testObj);
    });

    it('should handle empty object', () => {
      const compactObj = compact();
      const result = compactObj({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({});
    });
  });

  describe('isObjectEmpty', () => {
    it('should return true for empty object', () => {
      const checkEmpty = isObjectEmpty();
      const result = checkEmpty({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toBe(true);
    });

    it('should return false for non-empty object', () => {
      const checkEmpty = isObjectEmpty();
      const result = checkEmpty({ a: 1 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toBe(false);
    });
  });

  describe('merge', () => {
    it('should merge objects without conflicts', () => {
      const mergeObjs = merge(() => success('resolved'));
      const result = mergeObjs({ a: 1 }, { b: 2 }, { c: 3 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle conflicts with conflict resolver', () => {
      const mergeObjs = merge((_key, target, source) => success(`${target}-${source}`));
      const result = mergeObjs({ a: 'first' }, { a: 'second', b: 2 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ a: 'first-second', b: 2 });
    });

    it('should fail when conflict resolver fails', () => {
      const mergeObjs = merge(() => failure('Conflict resolution failed'));
      const result = mergeObjs({ a: 1 }, { a: 2 });

      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Conflict resolution failed');
    });

    it('should handle empty sources', () => {
      const mergeObjs = merge(() => success('resolved'));
      const result = mergeObjs();

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({});
    });
  });

  describe('defaults', () => {
    it('should apply defaults for missing properties', () => {
      const withDefaults = defaults({ name: 'Anonymous', age: 0 });
      const result = withDefaults({ name: 'John' });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ name: 'John', age: 0 });
    });

    it('should not override existing properties', () => {
      const withDefaults = defaults({ name: 'Anonymous', age: 0 });
      const result = withDefaults({ name: 'John', age: 30, city: 'NYC' });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ name: 'John', age: 30, city: 'NYC' });
    });

    it('should handle empty defaults', () => {
      const withDefaults = defaults({});
      const result = withDefaults({ name: 'John' });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual({ name: 'John' });
    });
  });

  describe('keys', () => {
    it('should return all object keys', () => {
      const getKeys = keys();
      const result = getKeys({ a: 1, b: 2, c: 3 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty object', () => {
      const getKeys = keys();
      const result = getKeys({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual([]);
    });
  });

  describe('values', () => {
    it('should return all object values', () => {
      const getValues = values();
      const result = getValues({ a: 1, b: 2, c: 3 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual([1, 2, 3]);
    });

    it('should handle empty object', () => {
      const getValues = values();
      const result = getValues({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual([]);
    });
  });

  describe('entries', () => {
    it('should return all key-value pairs', () => {
      const getEntries = entries();
      const result = getEntries({ a: 1, b: 2 });

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });

    it('should handle empty object', () => {
      const getEntries = entries();
      const result = getEntries({});

      expect(result.isSuccess()).toBe(true);
      const [value] = result.unwrap();
      expect(value).toEqual([]);
    });
  });

  describe('clone', () => {
    it('should clone simple object', () => {
      const cloneObj = clone({}, () => 'Max depth exceeded');
      const original = { a: 1, b: 'hello' };
      const result = cloneObj(original);

      expect(result.isSuccess()).toBe(true);
      const [cloned] = result.unwrap();
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested object', () => {
      const cloneObj = clone({}, () => 'Max depth exceeded');
      const original = { a: 1, b: { c: 2, d: { e: 3 } } };
      const result = cloneObj(original);

      expect(result.isSuccess()).toBe(true);
      const [cloned] = result.unwrap();
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect((cloned as any).b).not.toBe(original.b);
      expect((cloned as any).b.d).not.toBe(original.b.d);
    });

    it('should clone arrays', () => {
      const cloneObj = clone({}, () => 'Max depth exceeded');
      const original = { a: [1, 2, { b: 3 }] };
      const result = cloneObj(original);

      expect(result.isSuccess()).toBe(true);
      const [cloned] = result.unwrap();
      expect(cloned).toEqual(original);
      expect((cloned as any).a).not.toBe(original.a);
      expect((cloned as any).a[2]).not.toBe(original.a[2]);
    });

    it('should respect maxDepth limit', () => {
      const cloneObj = clone({ maxDepth: 2 }, depth => `Max depth ${depth} exceeded`);
      const original = { a: { b: { c: { d: 1 } } } };
      const result = cloneObj(original);

      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Max depth 3 exceeded');
    });

    it('should handle functions based on cloneFunctions option', () => {
      const fn = () => 'test';
      const original = { a: 1, fn };

      // Without cloning functions (default)
      const cloneObj1 = clone({}, () => 'Max depth exceeded');
      const result1 = cloneObj1(original);
      expect(result1.isSuccess()).toBe(true);
      const [cloned1] = result1.unwrap();
      expect((cloned1 as any).fn).toBe(fn); // Same reference

      // With cloning functions
      const cloneObj2 = clone({ cloneFunctions: true }, () => 'Max depth exceeded');
      const result2 = cloneObj2(original);
      expect(result2.isSuccess()).toBe(true);
      const [cloned2] = result2.unwrap();
      expect((cloned2 as any).fn).toBe(fn); // Functions can't really be cloned, so same reference
    });

    it('should handle null and undefined values', () => {
      const cloneObj = clone({}, () => 'Max depth exceeded');
      const original = { a: null, b: undefined, c: 'hello' };
      const result = cloneObj(original);

      expect(result.isSuccess()).toBe(true);
      const [cloned] = result.unwrap();
      expect(cloned).toEqual(original);
    });

    it('should handle primitives', () => {
      const cloneObj = clone({}, () => 'Max depth exceeded');

      // Test number
      const result1 = cloneObj(42);
      expect(result1.isSuccess()).toBe(true);
      const [cloned1] = result1.unwrap();
      expect(cloned1).toBe(42);

      // Test string
      const result2 = cloneObj('hello');
      expect(result2.isSuccess()).toBe(true);
      const [cloned2] = result2.unwrap();
      expect(cloned2).toBe('hello');
    });

    it('should use default maxDepth of 10', () => {
      const cloneObj = clone({}, depth => `Max depth ${depth} exceeded`);

      // Create object with depth exactly 11 (should fail)
      let deep: any = { value: 'deep' };
      for (let i = 0; i < 10; i++) {
        deep = { nested: deep };
      }

      const result = cloneObj(deep);
      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Max depth 11 exceeded');
    });

    it('should fail when cloning array with max depth exceeded', () => {
      const cloneObj = clone({ maxDepth: 1 }, depth => `Max depth ${depth} exceeded`);

      // Create array with nested object that exceeds depth
      const original = [{ nested: { deep: 'value' } }];

      const result = cloneObj(original);
      expect(result.isFailure()).toBe(true);
      const [, error] = result.unwrap();
      expect(error).toBe('Max depth 2 exceeded');
    });
  });
});
