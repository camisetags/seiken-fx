import { prop, pick, omit, propResult, pickResult, omitResult, getPath } from '../src/object';

describe('Object utilities', () => {
  const testObj = {
    name: 'John',
    age: 30,
    city: 'New York',
    country: 'USA',
  };

  describe('prop', () => {
    it('should extract a property from an object', () => {
      const getName = prop<typeof testObj, 'name'>('name');
      expect(getName(testObj)).toBe('John');
    });

    it('should handle undefined properties', () => {
      const getUnknown = prop<any, any>('unknown' as any);
      expect(getUnknown(testObj)).toBeUndefined();
    });
  });

  describe('pick', () => {
    it('should pick specific properties from an object', () => {
      const pickNameAndAge = pick<typeof testObj, 'name' | 'age'>(['name', 'age']);
      expect(pickNameAndAge(testObj)).toEqual({
        name: 'John',
        age: 30,
      });
    });

    it('should handle empty key array', () => {
      const pickNothing = pick([]);
      expect(pickNothing(testObj)).toEqual({});
    });
  });

  describe('omit', () => {
    it('should omit specific properties from an object', () => {
      const omitNameAndAge = omit<typeof testObj, 'name' | 'age'>(['name', 'age']);
      expect(omitNameAndAge(testObj)).toEqual({
        city: 'New York',
        country: 'USA',
      });
    });

    it('should handle empty key array', () => {
      const omitNothing = omit<typeof testObj, never>([]);
      expect(omitNothing(testObj)).toEqual(testObj);
    });
  });

  describe('propResult', () => {
    it('should return Success when property exists', () => {
      const getNameResult = propResult<typeof testObj, 'name', string>('name', () => 'Property not found');
      const result = getNameResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe('John');
      expect(error).toBe(null);
    });

    it('should return Failure when property does not exist', () => {
      const getUnknownResult = propResult<any, any, string>('unknown' as any, () => 'Property not found');
      const result = getUnknownResult(testObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Property not found');
    });

    it('should return Failure when property is undefined', () => {
      const objWithUndefined = { ...testObj, undefinedProp: undefined };
      const getUndefinedResult = propResult<typeof objWithUndefined, 'undefinedProp', string>(
        'undefinedProp',
        () => 'Property is undefined'
      );
      const result = getUndefinedResult(objWithUndefined);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Property is undefined');
    });
  });

  describe('pickResult', () => {
    it('should return Success when all properties exist', () => {
      const pickNameAndAgeResult = pickResult<typeof testObj, 'name' | 'age', string>(
        ['name', 'age'],
        (key) => `Missing property: ${String(key)}`
      );
      const result = pickNameAndAgeResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({
        name: 'John',
        age: 30,
      });
      expect(error).toBe(null);
    });

    it('should return Failure when any property is missing', () => {
      const pickWithMissingResult = pickResult<any, any, string>(
        ['name', 'unknown'],
        (key) => `Missing property: ${String(key)}`
      );
      const result = pickWithMissingResult(testObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Missing property: unknown');
    });

    it('should handle empty key array', () => {
      const pickNothingResult = pickResult<typeof testObj, never, string>(
        [],
        (key) => `Missing property: ${String(key)}`
      );
      const result = pickNothingResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({});
      expect(error).toBe(null);
    });
  });

  describe('omitResult', () => {
    it('should return Success with omitted properties', () => {
      const omitNameAndAgeResult = omitResult<typeof testObj, 'name' | 'age'>(['name', 'age']);
      const result = omitNameAndAgeResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({
        city: 'New York',
        country: 'USA',
      });
      expect(error).toBe(null);
    });

    it('should handle empty key array', () => {
      const omitNothingResult = omitResult<typeof testObj, never>([]);
      const result = omitNothingResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual(testObj);
      expect(error).toBe(null);
    });
  });

  describe('getPath', () => {
    const nestedObj = {
      user: {
        profile: {
          personal: {
            name: 'John',
            age: 30,
          },
          contact: {
            email: 'john@example.com',
          },
        },
      },
      settings: {
        theme: 'dark',
      },
    };

    it('should return Success when path exists', () => {
      const getNestedName = getPath<typeof nestedObj, string>(
        ['user', 'profile', 'personal', 'name'],
        (path) => `Path not found: ${path}`
      );
      const result = getNestedName(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe('John');
      expect(error).toBe(null);
    });

    it('should return Success for single-level path', () => {
      const getSettings = getPath<typeof nestedObj, string>(
        ['settings'],
        (path) => `Path not found: ${path}`
      );
      const result = getSettings(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({ theme: 'dark' });
      expect(error).toBe(null);
    });

    it('should return Failure when path does not exist', () => {
      const getInvalidPath = getPath<typeof nestedObj, string>(
        ['user', 'profile', 'invalid', 'prop'],
        (path) => `Path not found: ${path}`
      );
      const result = getInvalidPath(nestedObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile.invalid.prop');
    });

    it('should return Failure when intermediate value is null', () => {
      const objWithNull = {
        user: null,
      };
      const getFromNull = getPath<typeof objWithNull, string>(
        ['user', 'profile'],
        (path) => `Path not found: ${path}`
      );
      const result = getFromNull(objWithNull);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile');
    });

    it('should return Failure when intermediate value is undefined', () => {
      const objWithUndefined = {
        user: undefined,
      };
      const getFromUndefined = getPath<typeof objWithUndefined, string>(
        ['user', 'profile'],
        (path) => `Path not found: ${path}`
      );
      const result = getFromUndefined(objWithUndefined);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile');
    });

    it('should handle empty path array', () => {
      const getRoot = getPath<typeof nestedObj, string>(
        [],
        (path) => `Path not found: ${path}`
      );
      const result = getRoot(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(nestedObj);
      expect(error).toBe(null);
    });
  });
});
