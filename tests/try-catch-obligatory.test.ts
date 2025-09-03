import { failure, tryCatch } from '../src/result';

describe('Try-Catch Tests', () => {
  describe('TryCatch Function Usage', () => {
    it('should handle successful operations', () => {
      const result = tryCatch(
        () => 'hello'.toUpperCase(),
        error => `Error: ${error}`
      );

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('HELLO');
    });

    it('should handle operations with side effects', () => {
      let sideEffectCalled = false;

      const result = tryCatch(
        () => {
          sideEffectCalled = true;
          return 'test'.toUpperCase();
        },
        error => `Error: ${error}`
      );

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('TEST');
      expect(sideEffectCalled).toBe(true);
    });

    it('should handle exceptions properly', () => {
      const result = tryCatch(
        () => JSON.parse('invalid json'),
        error => `Parse error: ${(error as Error).message}`
      );

      expect(result.isFailure()).toBe(true);
      expect(result.fold(err => err, () => '')).toContain('Parse error:');
    });

    it('should allow chaining after tryCatch', () => {
      const result = tryCatch(
        () => 'hello'.toUpperCase(),
        error => `Error: ${error}`
      ).map(str => str.toLowerCase());

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('hello');
    });

    it('should handle successful operations with chaining', () => {
      const result = tryCatch(
        () => parseInt('5', 10),
        () => -1
      ).map(num => num * 2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe(10);
    });

    it('should handle error recovery patterns', () => {
      const result = failure('initial error')
        .recover(() => 'fallback')
        .map(str => str.toUpperCase());

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('FALLBACK');
    });

    it('should handle nested tryCatch operations', () => {
      const result = tryCatch(
        () => JSON.parse('{"value": "test"}'),
        () => ({ value: 'fallback' })
      ).flatMap(obj => tryCatch(
        () => obj.value.toUpperCase(),
        () => 'ERROR'
      ));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('TEST');
    });

    it('should demonstrate safe exception handling', () => {
      // These examples show proper tryCatch usage
      
      // ✅ Valid: tryCatch with success
      const valid1 = tryCatch(
        () => 'test'.toUpperCase(),
        () => 'default'
      );

      // ✅ Valid: tryCatch with chaining
      const valid2 = tryCatch(
        () => 'test'.toUpperCase(),
        () => 'default'
      ).map(str => str.toLowerCase());

      // ✅ Valid: nested tryCatch
      const valid3 = tryCatch(
        () => 'test',
        () => 'error'
      ).flatMap(str => tryCatch(
        () => str.toUpperCase(),
        () => 'nested error'
      ));

      expect(valid1.isSuccess()).toBe(true);
      expect(valid2.isSuccess()).toBe(true);
      expect(valid3.isSuccess()).toBe(true);
    });

    it('should handle complex exception scenarios', () => {
      const throwingFunction = (input: string) => {
        if (input === 'throw') {
          throw new Error('Intentional error');
        }
        return input.toUpperCase();
      };

      const result1 = tryCatch(
        () => throwingFunction('hello'),
        error => `Caught: ${(error as Error).message || error}`
      ).map(str => str.length);

      const result2 = tryCatch(
        () => throwingFunction('throw'),
        error => `Caught: ${(error as Error).message || error}`
      );

      expect(result1.isSuccess()).toBe(true);
      expect(result1.getOrThrow()).toBe(5); // 'HELLO'.length

      expect(result2.isFailure()).toBe(true);
      expect(result2.fold(err => err, () => '')).toContain('Caught: Intentional error');
    });

    it('should handle side effects properly', () => {
      const sideEffects: string[] = [];

      const result = tryCatch(
        () => {
          sideEffects.push('operation executed');
          return 'test'.toUpperCase();
        },
        () => {
          sideEffects.push('error handled');
          return 'error';
        }
      ).map(str => {
        sideEffects.push('map executed');
        return str.toLowerCase();
      });

      console.log('Short:', result.getOrThrow());
      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('test');
      expect(sideEffects).toEqual([
        'operation executed',
        'map executed'
      ]);
    });

    it('should handle multiple tryCatch operations in sequence', () => {
      const result = tryCatch(
        () => 'start'.toUpperCase(),
        () => 'first-error'
      ).flatMap(str => tryCatch(
        () => str + '-MIDDLE',
        () => 'second-error'
      )).flatMap(str => tryCatch(
        () => str.toLowerCase(),
        () => 'third-error'
      ));

      expect(result.isSuccess()).toBe(true);
      expect(result.getOrThrow()).toBe('start-middle');
    });

    it('should preserve error information properly', () => {
      const result = tryCatch(
        () => JSON.parse('{"malformed": }'),
        error => ({
          errorType: (error as Error).name,
          errorMessage: (error as Error).message,
          originalInput: '{"malformed": }'
        })
      );

      expect(result.isFailure()).toBe(true);
      const errorValue = result.fold(err => err, () => null as any);
      expect(errorValue.errorType).toBe('SyntaxError');
      expect(errorValue.errorMessage).toContain('JSON');
      expect(errorValue.originalInput).toBe('{"malformed": }');
    });
  });
});