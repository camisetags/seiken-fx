import { success, failure, Result } from '../src/result';

// Exemplo de uso do método .match() com pattern matching estilo Elixir
console.log('=== Exemplos de Pattern Matching com .match() ===\n');

// Exemplo 1: Pattern básico
console.log('1. Pattern básico:');
const basicResult = success('hello world');
const basicOutput = basicResult.match([
  [success, (value: any) => `Got: ${value}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${basicOutput}`);

// Exemplo 2: Pattern com guard
console.log('\n2. Pattern com guard:');
const numberResult = success(15);
const guardOutput = numberResult.match([
  [success, (value: any) => value > 10, (value: any) => `Large: ${value}`],
  [success, (value: any) => value <= 10, (value: any) => `Small: ${value}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${guardOutput}`);

// Exemplo 3: Pattern com destructuring
console.log('\n3. Pattern com destructuring:');
const userResult = success({ id: 1, name: 'John', age: 25 });
const destructuringOutput = userResult.match([
  [success, { age: 25 }, (user: any) => `Adult: ${user.name}`],
  [success, { age: 18 }, (user: any) => `Young adult: ${user.name}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${destructuringOutput}`);

// Exemplo 4: Pattern com Failure
console.log('\n4. Pattern com Failure:');
const errorResult = failure('database error');
const failureOutput = errorResult.match([
  [success, (value: any) => `Success: ${value}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${failureOutput}`);

// Exemplo 5: Múltiplos patterns em ordem
console.log('\n5. Múltiplos patterns em ordem:');
const complexResult = success(42);
const complexOutput = complexResult.match([
  [success, (value: any) => value > 100, (value: any) => `Huge: ${value}`],
  [success, (value: any) => value > 50, (value: any) => `Large: ${value}`],
  [success, (value: any) => value > 25, (value: any) => `Medium: ${value}`],
  [success, (value: any) => value > 0, (value: any) => `Small: ${value}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${complexOutput}`);

// Exemplo 6: Pattern com arrays
console.log('\n6. Pattern com arrays:');
const arrayResult = success([1, 2, 3, 4, 5]);
const arrayOutput = arrayResult.match([
  [success, (arr: any) => arr.length > 10, (arr: any) => `Long array: ${arr.length}`],
  [success, (arr: any) => arr.length > 5, (arr: any) => `Medium array: ${arr.length}`],
  [success, (arr: any) => arr.length > 0, (arr: any) => `Short array: ${arr.length}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${arrayOutput}`);

// Exemplo 7: Pattern com strings
console.log('\n7. Pattern com strings:');
const stringResult = success('hello world');
const stringOutput = stringResult.match([
  [success, (str: any) => str.includes('hello') && str.includes('world'), (str: any) => `Complete: ${str}`],
  [success, (str: any) => str.includes('hello'), (str: any) => `Partial: ${str}`],
  [success, (str: any) => str.length > 0, (str: any) => `Any: ${str}`],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${stringOutput}`);

// Exemplo 8: Pattern com objetos aninhados
console.log('\n8. Pattern com objetos aninhados:');
const nestedResult = success({
  user: {
    profile: {
      name: 'John',
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    }
  }
});
const nestedOutput = nestedResult.match([
  [success, (data: any) => data.user?.profile?.preferences?.theme === 'dark', (data: any) => 'Dark theme user'],
  [success, (data: any) => data.user?.profile?.preferences?.theme === 'light', (data: any) => 'Light theme user'],
  [failure, (error: any) => `Error: ${error}`]
]);
console.log(`Resultado: ${nestedOutput}`);

console.log('\n=== Fim dos exemplos ===');
