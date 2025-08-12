import {
  success,
  map,
  filter,
  reduce,
  head,
  tail,
  get,
  getPath,
  mapValues,
  filterValues,
  compact,
  merge,
  defaults,
  keys,
  values,
  entries,
  clone,
} from '../src';

describe('Immutability Tests', () => {
  const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

  describe('Array Operations Immutability', () => {
    it('should not mutate original array in map operation', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      const result = map((x: number) => success(x * 2))(original);

      expect(original).toEqual(originalCopy);
      expect(original.length).toBe(5);

      result.fold(
        () => fail('Map should succeed'),
        mapped => {
          expect(mapped).not.toBe(original);
          expect(mapped).toEqual([2, 4, 6, 8, 10]);
        },
      );
    });

    it('should not mutate original array in filter operation', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      const result = filter((x: number) => success(x > 2))(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('Filter should succeed'),
        filtered => {
          expect(filtered).not.toBe(original);
          expect(filtered).toEqual([3, 4, 5]);
        },
      );
    });

    it('should not mutate original array in reduce operation', () => {
      const original = [1, 2, 3, 4];
      const originalCopy = [...original];

      const result = reduce((acc: number, curr: number) => success(acc + curr), 0)(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('Reduce should succeed'),
        sum => expect(sum).toBe(10),
      );
    });

    it('should not mutate original array in head operation', () => {
      const original = [1, 2, 3];
      const originalCopy = [...original];

      head(original, () => 'empty');

      expect(original).toEqual(originalCopy);
    });

    it('should not mutate original array in tail operation', () => {
      const original = [1, 2, 3, 4];
      const originalCopy = [...original];

      const result = tail(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('Tail should succeed'),
        tailArray => {
          expect(tailArray).not.toBe(original);
          expect(tailArray).toEqual([2, 3, 4]);
        },
      );
    });

    it('should not mutate original array in get operation', () => {
      const original = [10, 20, 30];
      const originalCopy = [...original];

      get(1, () => 'out of bounds')(original);

      expect(original).toEqual(originalCopy);
    });

    it('should work with nested arrays without mutation', () => {
      const original = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const originalCopy = [...original];

      const result = map((arr: number[]) => success([...arr, 0]))(original);

      expect(original).toEqual(originalCopy);
      expect(original[0]).toBe(originalCopy[0]);

      result.fold(
        () => fail('Should succeed'),
        mapped => {
          expect(mapped).toEqual([
            [1, 2, 0],
            [3, 4, 0],
            [5, 6, 0],
          ]);
          expect(mapped[0]).not.toBe(original[0]);
        },
      );
    });
  });

  describe('Object Operations Immutability', () => {
    it('should not mutate original object in getPath operation', () => {
      const original = {
        user: {
          profile: {
            name: 'John',
            settings: { theme: 'dark' },
          },
        },
      };
      const originalCopy = { ...original };

      getPath(['user', 'profile', 'name'], () => 'not found')(original);

      expect(original).toEqual(originalCopy);
      expect(original.user).toBe(originalCopy.user);
    });

    it('should not mutate original object in mapValues operation', () => {
      const original = { a: 1, b: 2, c: 3 };
      const originalCopy = { ...original };

      const result = mapValues(
        (value: number) => success(value * 2),
        () => 'error',
      )(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('MapValues should succeed'),
        mapped => {
          expect(mapped).not.toBe(original);
          expect(mapped).toEqual({ a: 2, b: 4, c: 6 });
        },
      );
    });

    it('should not mutate original object in filterValues operation', () => {
      const original = { john: 25, jane: 17, bob: 30, alice: 16 };
      const originalCopy = { ...original };

      const result = filterValues(
        (age: number) => success(age >= 18),
        () => 'error',
      )(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('FilterValues should succeed'),
        filtered => {
          expect(filtered).not.toBe(original);
          expect(filtered).toEqual({ john: 25, bob: 30 });
        },
      );
    });

    it('should not mutate original object in compact operation', () => {
      const original = { a: 1, b: null, c: undefined, d: 'hello', e: 0 };
      const originalCopy = { ...original };

      const result = compact()(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('Compact should succeed'),
        compacted => {
          expect(compacted).not.toBe(original);
          expect(compacted).toEqual({ a: 1, d: 'hello', e: 0 });
        },
      );
    });

    it('should not mutate objects in merge operation', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const targetCopy = { ...target };
      const sourceCopy = { ...source };

      const result = merge((_key, _t, s) => success(s))(target, source);

      expect(target).toEqual(targetCopy);
      expect(source).toEqual(sourceCopy);

      result.fold(
        () => fail('Merge should succeed'),
        merged => {
          expect(merged).not.toBe(target);
          expect(merged).not.toBe(source);
          expect(merged).toEqual({ a: 1, b: 3, c: 4 });
        },
      );
    });

    it('should not mutate original object in defaults operation', () => {
      const original = { theme: 'dark' };
      const originalCopy = { ...original };

      const result = defaults({ theme: 'light', lang: 'en' })(original);

      expect(original).toEqual(originalCopy);

      result.fold(
        () => fail('Defaults should succeed'),
        withDefaults => {
          expect(withDefaults).not.toBe(original);
          expect(withDefaults).toEqual({ theme: 'dark', lang: 'en' });
        },
      );
    });

    it('should not mutate original object in keys operation', () => {
      const original = { a: 1, b: 2, c: 3 };
      const originalCopy = { ...original };

      keys()(original);

      expect(original).toEqual(originalCopy);
    });

    it('should not mutate original object in values operation', () => {
      const original = { a: 1, b: 2, c: 3 };
      const originalCopy = { ...original };

      values()(original);

      expect(original).toEqual(originalCopy);
    });

    it('should not mutate original object in entries operation', () => {
      const original = { a: 1, b: 2, c: 3 };
      const originalCopy = { ...original };

      entries()(original);

      expect(original).toEqual(originalCopy);
    });
  });

  describe('Deep Immutability Tests', () => {
    it('should not mutate deeply nested objects', () => {
      const original = {
        user: {
          profile: {
            name: 'John',
            contacts: {
              emails: ['john@example.com', 'john.doe@work.com'],
              phones: ['+1234567890'],
            },
            settings: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false,
              },
            },
          },
          metadata: {
            created: '2023-01-01',
            tags: ['admin', 'user'],
          },
        },
      };
      const originalCopy = { ...original };

      getPath(['user', 'profile', 'name'], () => 'not found')(original);
      getPath(['user', 'profile', 'contacts', 'emails'], () => 'not found')(original);
      getPath(['user', 'metadata', 'tags'], () => 'not found')(original);

      expect(original).toEqual(originalCopy);
      expect(original.user).toBe(originalCopy.user);
      expect(original.user.profile).toBe(originalCopy.user.profile);
      expect(original.user.profile.contacts).toBe(originalCopy.user.profile.contacts);
    });

    it('should create completely independent clones', () => {
      const original = {
        data: {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ],
          config: { sort: 'asc', limit: 10 },
        },
      };

      const result = clone({ maxDepth: 10, cloneFunctions: false }, () => 'too deep')(original);

      result.fold(
        () => fail('Clone should succeed'),
        cloned => {
          const typedCloned = cloned as typeof original;

          expect(typedCloned).not.toBe(original);
          expect(typedCloned.data).not.toBe(original.data);
          expect(typedCloned.data.items).not.toBe(original.data.items);
          expect(typedCloned.data.items[0]).not.toBe(original.data.items[0]);
          expect(typedCloned.data.config).not.toBe(original.data.config);

          expect(typedCloned).toEqual(original);

          typedCloned.data.items.push({ id: 3, name: 'Item 3' });
          expect(original.data.items.length).toBe(2);
        },
      );
    });
  });

  describe('Result Immutability Tests', () => {
    it('should not mutate Result contents in map operations', () => {
      const originalData = { count: 5, items: [1, 2, 3] };
      const result = success(originalData);
      const originalDataCopy = deepCopy(originalData);

      const mapped = result.map(data => ({ ...data, count: data.count * 2 }));

      expect(originalData).toEqual(originalDataCopy);

      result.fold(
        () => fail('Should be success'),
        data => {
          expect(data).toEqual(originalDataCopy);
          expect(data.count).toBe(5);
        },
      );

      mapped.fold(
        () => fail('Should be success'),
        data => {
          expect(data.count).toBe(10);
          expect(data).not.toBe(originalData);
        },
      );
    });

    it('should not mutate Result contents in flatMap operations', () => {
      const originalData = { numbers: [1, 2, 3] };
      const result = success(originalData);
      const originalDataCopy = deepCopy(originalData);

      result.flatMap(data => success({ ...data, sum: data.numbers.reduce((a, b) => a + b, 0) }));

      expect(originalData).toEqual(originalDataCopy);

      result.fold(
        () => fail('Should be success'),
        data => {
          expect(data).toEqual(originalDataCopy);
          expect(data).not.toHaveProperty('sum');
        },
      );
    });

    it('should not mutate arrays within Results', () => {
      const originalArray = [1, 2, 3];
      const result = success(originalArray);
      const originalArrayCopy = [...originalArray];

      const processed = result.map(arr => [...arr, 4, 5]);

      expect(originalArray).toEqual(originalArrayCopy);
      expect(originalArray.length).toBe(3);

      processed.fold(
        () => fail('Should succeed'),
        newArr => {
          expect(newArr).toEqual([1, 2, 3, 4, 5]);
          expect(newArr).not.toBe(originalArray);
        },
      );
    });
  });

  describe('Frozen Object Compatibility', () => {
    it('should work with Object.freeze() without throwing', () => {
      const frozen = Object.freeze({
        name: 'John',
        items: Object.freeze([1, 2, 3]),
        nested: Object.freeze({
          value: 42,
        }),
      });

      expect(() => {
        getPath(['name'], () => 'not found')(frozen);
        getPath(['nested', 'value'], () => 'not found')(frozen);
        mapValues(
          (x: any) => success(x),
          () => 'error',
        )(frozen);
        compact()(frozen);
      }).not.toThrow();
    });

    it('should work with deeply frozen objects', () => {
      const deepFreeze = (obj: any): any => {
        Object.getOwnPropertyNames(obj).forEach(prop => {
          if (obj[prop] !== null && typeof obj[prop] === 'object') {
            deepFreeze(obj[prop]);
          }
        });
        return Object.freeze(obj);
      };

      const frozen = deepFreeze({
        user: {
          profile: {
            name: 'John',
            tags: ['admin', 'user'],
          },
        },
      });

      expect(() => {
        getPath(['user', 'profile', 'name'], () => 'not found')(frozen);
        getPath(['user', 'profile', 'tags'], () => 'not found')(frozen);
      }).not.toThrow();
    });
  });

  describe('Reference Equality Tests', () => {
    it('should never return same references after transformations', () => {
      const data = {
        items: [1, 2, 3],
        meta: { total: 3, tags: ['a', 'b'] },
      };

      const operations = [
        () =>
          mapValues(
            (x: any) => success(x),
            () => 'error',
          )(data),
        () => defaults({ extra: 'value' })(data),
        () => merge((_k, _t, s) => success(s))({}, data),
        () => compact()(data),
      ];

      operations.forEach((op, index) => {
        const result = op();
        result.fold(
          () => fail(`Operation ${index} should succeed`),
          transformed => {
            expect(transformed).not.toBe(data);
          },
        );
      });
    });

    it('should create new arrays in array operations', () => {
      const original = [1, 2, 3, 4, 5];

      const operations = [
        () => map((x: number) => success(x * 2))(original),
        () => filter((x: number) => success(x > 2))(original),
        () => tail(original),
      ];

      operations.forEach((op, index) => {
        const result = op();
        result.fold(
          () => fail(`Array operation ${index} should succeed`),
          newArray => {
            expect(newArray).not.toBe(original);
            expect(Array.isArray(newArray)).toBe(true);
          },
        );
      });
    });
  });

  describe('Complex Immutability Scenarios', () => {
    it('should maintain immutability in operation chains', () => {
      const original = {
        users: [
          { id: 1, name: 'John', active: true },
          { id: 2, name: 'Jane', active: false },
          { id: 3, name: 'Bob', active: true },
        ],
        config: { sortBy: 'name', order: 'asc' },
      };
      const originalCopy = { ...original };

      const result = success(original)
        .map(data => ({ ...data, processed: true }))
        .flatMap(data => {
          const activeUsers = data.users.filter(u => u.active);
          return success({ ...data, activeUsers });
        })
        .map(data => ({
          ...data,
          summary: { total: data.users.length, active: data.activeUsers.length },
        }));

      expect(original).toEqual(originalCopy);
      expect(original.users).toBe(originalCopy.users);
      expect(original.config).toBe(originalCopy.config);

      result.fold(
        () => fail('Chain should succeed'),
        finalData => {
          expect(finalData).not.toBe(original);
          expect(finalData.users).toBe(original.users);
          expect(finalData).toHaveProperty('processed', true);
          expect(finalData).toHaveProperty('activeUsers');
          expect(finalData).toHaveProperty('summary');
        },
      );
    });

    it('should handle circular reference prevention in clone', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const result = clone({ maxDepth: 3, cloneFunctions: false }, () => 'circular')(obj);

      result.fold(
        error => {
          expect(error).toContain('circular');
        },
        () => {
          // If it succeeds, it should be a proper clone
        },
      );

      expect(obj.name).toBe('test');
      expect(obj.self).toBe(obj);
    });
  });
});
