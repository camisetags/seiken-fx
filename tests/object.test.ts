import { prop, pick, omit, getPath } from '../src/object';

describe('Object utilities', () => {
  const testObj = {
    name: 'John',
    age: 30,
    city: 'New York',
    country: 'USA',
  };

  describe('prop', () => {
    it('should return Success when property exists', () => {
      const getNameResult = prop<typeof testObj, 'name', string>(
        'name',
        () => 'Property not found',
      );
      const result = getNameResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe('John');
      expect(error).toBe(null);
    });

    it('should return Failure when property does not exist', () => {
      const getUnknownResult = prop<any, any, string>('unknown' as any, () => 'Property not found');
      const result = getUnknownResult(testObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Property not found');
    });
  });

  describe('pick', () => {
    it('should return Success when all properties exist', () => {
      const pickNameAndAgeResult = pick<typeof testObj, 'name' | 'age', string>(
        ['name', 'age'],
        key => `Missing property: ${String(key)}`,
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
      const pickWithMissingResult = pick<any, any, string>(
        ['name', 'unknown'],
        key => `Missing property: ${String(key)}`,
      );
      const result = pickWithMissingResult(testObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Missing property: unknown');
    });

    it('should handle empty key array', () => {
      const pickNothingResult = pick<typeof testObj, never, string>(
        [],
        key => `Missing property: ${String(key)}`,
      );
      const result = pickNothingResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({});
      expect(error).toBe(null);
    });
  });

  describe('omit', () => {
    it('should return Success with omitted properties', () => {
      const omitNameAndAgeResult = omit<typeof testObj, 'name' | 'age'>(['name', 'age']);
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
      const omitNothingResult = omit<typeof testObj, never>([]);
      const result = omitNothingResult(testObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual(testObj);
      expect(error).toBe(null);
    });

    it('should handle omitting non-existent properties', () => {
      const omitUnknownResult = omit<typeof testObj, any>(['unknown' as any]);
      const result = omitUnknownResult(testObj);

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
          name: 'John',
          settings: {
            theme: 'dark',
          },
        },
      },
      metadata: {
        version: '1.0',
      },
    };

    it('should return Success when path exists', () => {
      const getNestedName = getPath<typeof nestedObj, string>(
        ['user', 'profile', 'name'],
        path => `Path not found: ${path}`,
      );
      const result = getNestedName(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe('John');
      expect(error).toBe(null);
    });

    it('should return Success for single-level path', () => {
      const getMetadata = getPath<typeof nestedObj, string>(
        ['metadata'],
        path => `Path not found: ${path}`,
      );
      const result = getMetadata(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toEqual({ version: '1.0' });
      expect(error).toBe(null);
    });

    it('should return Failure when path does not exist', () => {
      const getInvalidPath = getPath<typeof nestedObj, string>(
        ['user', 'profile', 'invalid'],
        path => `Path not found: ${path}`,
      );
      const result = getInvalidPath(nestedObj);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile.invalid');
    });

    it('should return Failure when intermediate value is null', () => {
      const objWithNull = { user: null };
      const getFromNull = getPath<typeof objWithNull, string>(
        ['user', 'profile'],
        path => `Path not found: ${path}`,
      );
      const result = getFromNull(objWithNull);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile');
    });

    it('should return Failure when intermediate value is undefined', () => {
      const objWithUndefined = { user: undefined };
      const getFromUndefined = getPath<typeof objWithUndefined, string>(
        ['user', 'profile'],
        path => `Path not found: ${path}`,
      );
      const result = getFromUndefined(objWithUndefined);

      expect(result.isFailure()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(null);
      expect(error).toBe('Path not found: user.profile');
    });

    it('should handle empty path array', () => {
      const getRoot = getPath<typeof nestedObj, string>([], path => `Path not found: ${path}`);
      const result = getRoot(nestedObj);

      expect(result.isSuccess()).toBe(true);
      const [value, error] = result.unwrap();
      expect(value).toBe(nestedObj);
      expect(error).toBe(null);
    });
  });
});
