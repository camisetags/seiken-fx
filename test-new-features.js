// Teste rápido das novas funcionalidades
import { success, failure, fromPromise, fromPromiseTuple } from './dist/index.esm.js';

console.log('=== Testando unwrap() ===');

const okResult = success(42);
const errResult = failure("Something went wrong");

console.log('success.unwrap():', okResult.unwrap()); // [42, null]
console.log('failure.unwrap():', errResult.unwrap()); // [null, "Something went wrong"]

console.log('\n=== Testando fromPromise melhorado ===');

// Versão simples (sem onError)
const simplePromise = Promise.resolve("Hello World");
const simpleResult = await fromPromise(simplePromise);
console.log('Simple result:', simpleResult.fold(e => `Error: ${e}`, v => `Success: ${v}`));

// Versão com onError customizado
const customResult = await fromPromise(simplePromise, e => `Custom error: ${e}`);
console.log('Custom result:', customResult.fold(e => `Error: ${e}`, v => `Success: ${v}`));

console.log('\n=== Testando fromPromiseTuple (Elixir style!) ===');

// Success case
const [data, error] = await fromPromiseTuple(Promise.resolve("User data"));
if (error) {
  console.log('Error:', error);
} else {
  console.log('Data:', data);
}

// Error case  
const [data2, error2] = await fromPromiseTuple(Promise.reject(new Error("Network failed")));
if (error2) {
  console.log('Error2:', error2.message);
} else {
  console.log('Data2:', data2);
}

console.log('\n=== Testando Result + destructuring ===');

const apiResult = await fromPromise(Promise.resolve({ name: "John", age: 30 }));
const [user, apiError] = apiResult.unwrap();

if (apiError) {
  console.log('API failed:', apiError);
} else {
  console.log('User:', user);
}

console.log('\n🎉 Todas as funcionalidades funcionando perfeitamente!');
