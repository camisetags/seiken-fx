import { prop, pick, omit } from '../src/object';

describe('Object utilities', () => {
  const testObj = {
    name: 'John',
    age: 30,
    city: 'New York',
    country: 'USA'
  };

  describe('prop', () => {
    it('should extract a property from an object', () => {
      const getName = prop('name');
      expect(getName(testObj)).toBe('John');
    });

    it('should handle undefined properties', () => {
      const getUnknown = prop('unknown' as any);
      expect(getUnknown(testObj)).toBeUndefined();
    });
  });

  describe('pick', () => {
    it('should pick specific properties from an object', () => {
      const pickNameAndAge = pick(['name', 'age']);
      expect(pickNameAndAge(testObj)).toEqual({
        name: 'John',
        age: 30
      });
    });

    it('should handle empty key array', () => {
      const pickNothing = pick([]);
      expect(pickNothing(testObj)).toEqual({});
    });
  });

  describe('omit', () => {
    it('should omit specific properties from an object', () => {
      const omitNameAndAge = omit(['name', 'age']);
      expect(omitNameAndAge(testObj)).toEqual({
        city: 'New York',
        country: 'USA'
      });
    });

    it('should handle empty key array', () => {
      const omitNothing = omit([]);
      expect(omitNothing(testObj)).toEqual(testObj);
    });
  });
});
