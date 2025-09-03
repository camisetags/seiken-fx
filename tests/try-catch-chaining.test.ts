import { success, failure } from '../src/result';

describe('try-catch chaining with other Result methods', () => {
  test('should chain .try().catch() with .map() and .flatMap() - failure case', () => {
    // parseInt("10") = 10, map(*2) = 20, 20 > 15, so it should fail
    const result = success('10')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .flatMap(value => (value > 15 ? failure('Value too large') : success(value)));

    expect(result.isFailure()).toBe(true);
    expect((result as any).error).toBe('Value too large');
  });

  test('should chain .try().catch() with .map() and .flatMap() - success case', () => {
    // parseInt("5") = 5, map(*2) = 10, 10 <= 15, so it should succeed
    const result = success('5')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .flatMap(value => (value > 15 ? failure('Value too large') : success(value)));

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe(10);
  });

  test('should chain .try().catch() with .if().then().else()', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = success('5')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .if(value => value > 5)
      .then(value => console.log(`Value ${value} is greater than 5`))
      .else(value => console.log(`Value ${value} is 5 or less`));

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe(10);
    expect(consoleSpy).toHaveBeenCalledWith('Value 10 is greater than 5');

    consoleSpy.mockRestore();
  });

  test('should handle complete chain with error case', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = success('5')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .flatMap(value => (value > 15 ? failure('Value too large') : success(value)))
      .if(value => value > 5)
      .then(value => console.log(`Value ${value} is greater than 5`))
      .else(value => console.log(`Value ${value} is 5 or less`));

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe(10);
    expect(consoleSpy).toHaveBeenCalledWith('Value 10 is greater than 5');

    consoleSpy.mockRestore();
  });

  test('should handle complete chain with failure case', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // parseInt("20") = 20, map(*2) = 40, 40 > 15, so it should fail
    const result = success('20')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .flatMap(value => (value > 15 ? failure('Value too large') : success(value)))
      .if(value => value > 5)
      .then(value => console.log(`Value ${value} is greater than 5`))
      .else(value => console.log(`Value ${value} is 5 or less`));

    expect(result.isFailure()).toBe(true);
    expect((result as any).error).toBe('Value too large');
    expect(consoleSpy).toHaveBeenCalledWith('Value Value too large is 5 or less');

    consoleSpy.mockRestore();
  });

  test('should chain .try().catch() with .match()', () => {
    const result = success('8')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .match([
        [success, (value: number) => value > 10, (value: number) => `Large: ${value}`],
        [success, (value: number) => value <= 10, (value: number) => `Small: ${value}`],
        [failure, (error: string) => `Error: ${error}`],
      ]);

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe('Large: 16');
  });

  test('should handle multiple .try().catch() in sequence', () => {
    const result = success('16')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .try(value => Math.sqrt(value))
      .catch(error => `Sqrt failed: ${error}`)
      .map(value => value * 2)
      .try(value => `Result: ${value}`)
      .catch(error => `Format failed: ${error}`);

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe('Result: 8');
  });

  test('should handle .try().catch() with custom validation', () => {
    const validateNumber = (value: number) => {
      if (value < 0) throw new Error('Value must be positive');
      if (value > 100) throw new Error('Value too large');
      return value;
    };

    const result = success('25')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .try(validateNumber)
      .catch(error => `Validation failed: ${error}`)
      .map(value => value * 2)
      .if(value => value > 50)
      .then(value => console.log(`Value ${value} is large`))
      .else(value => console.log(`Value ${value} is small`));

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe(50);
  });

  test('should handle .try().catch() with async-like operations', () => {
    const simulateAsyncOperation = (value: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (value % 2 === 0) {
          resolve(`Even: ${value}`);
        } else {
          reject(new Error(`Odd: ${value}`));
        }
      });
    };

    const result = success(8)
      .try(async value => {
        const result = await simulateAsyncOperation(value);
        return result;
      })
      .catch(error => `Async failed: ${error}`)
      .map(value => `Processed: ${value}`);

    expect(result.isSuccess()).toBe(true);
    expect(result.getOrThrow()).toBe('Processed: [object Promise]');
  });

  test('should handle complex pipeline with multiple error points', () => {
    const complexPipeline = (input: string) => {
      return success(input)
        .try(parseInt)
        .catch(error => `Parse failed: ${error}`)
        .flatMap(number => {
          if (number < 0) return failure('Number must be positive');
          if (number > 1000) return failure('Number too large');
          return success(number);
        })
        .try(number => Math.sqrt(number))
        .catch(error => `Square root failed: ${error}`)
        .map(sqrt => Math.round(sqrt * 100) / 100)
        .try(sqrt => `Result: ${sqrt}`)
        .catch(error => `Formatting failed: ${error}`);
    };

    // Success case
    const successResult = complexPipeline('64');
    expect(successResult.isSuccess()).toBe(true);
    expect(successResult.getOrThrow()).toBe('Result: 8');

    // Parse failure case - parseInt("invalid") returns NaN, which is not an error
    // So .catch() won't be triggered, and NaN will flow through
    const parseFailureResult = complexPipeline('invalid');
    expect(parseFailureResult.isSuccess()).toBe(true);
    expect(parseFailureResult.getOrThrow()).toBe('Result: NaN');

    // Validation failure case
    const validationFailureResult = complexPipeline('-5');
    expect(validationFailureResult.isFailure()).toBe(true);
    expect((validationFailureResult as any).error).toBe(
      'Formatting failed: Square root failed: Number must be positive',
    );

    // Range failure case
    const rangeFailureResult = complexPipeline('2000');
    expect(rangeFailureResult.isFailure()).toBe(true);
    expect((rangeFailureResult as any).error).toBe(
      'Formatting failed: Square root failed: Number too large',
    );
  });

  test('should maintain Result-based philosophy throughout the chain', () => {
    // parseInt("12") = 12, map(*2) = 24, 24 > 20, so it should fail
    const result = success('12')
      .try(parseInt)
      .catch(error => `Parse failed: ${error}`)
      .map(value => value * 2)
      .flatMap(value => (value > 20 ? failure('Too large') : success(value)))
      .if(value => value > 15)
      .then(value => console.log(`Large value: ${value}`))
      .else(value => console.log(`Small value: ${value}`))
      .map(value => `Final: ${value}`);

    expect(result.isFailure()).toBe(true);
    expect((result as any).error).toBe('Too large');
  });
});
