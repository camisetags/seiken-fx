import { success, failure, Result } from '../src/result';

console.log('=== Examples of .if().then().else() methods usage ===\n');

console.log('1. Simple conditional control:');
const numberResult = success(15);
numberResult
  .if(n => n > 10)
  .then(n => console.log(`✅ Number ${n} is greater than 10`))
  .else(n => console.log(`❌ Number ${n} is less than or equal to 10`));

console.log('\n2. False condition:');
const smallNumberResult = success(5);
smallNumberResult
  .if(n => n > 10)
  .then(n => console.log(`✅ Number ${n} is greater than 10`))
  .else(n => console.log(`❌ Number ${n} is less than or equal to 10`));

console.log('\n3. Conditional control with multiple actions:');
const largeNumberResult = success(25);
largeNumberResult
  .if(n => n > 20)
  .then(n => {
    console.log(`🎯 ${n} is very large!`);
    console.log(`📊 ${n} is in the high range`);
  })
  .else(n => console.log(`📊 ${n} is in the normal range`));

console.log('\n4. Working with complex objects:');
const userResult = success({
  name: 'John',
  age: 25,
  email: 'john@email.com'
});

userResult
  .if(user => user.age >= 18)
  .then(user => {
    console.log(`👤 ${user.name} is an adult`);
    console.log(`📧 Email: ${user.email}`);
  })
  .else(user => console.log(`👶 ${user.name} is underage`));

console.log('\n5. String validation:');
const textResult = success('hello world');
textResult
  .if(str => str.length > 10)
  .then(str => console.log(`📝 Long text: "${str}" (${str.length} characters)`))
  .else(str => console.log(`📝 Short text: "${str}" (${str.length} characters)`));

console.log('\n6. Error handling (Failure always executes .else):');
const errorResult = failure('Database connection error');
errorResult
  .if(_value => true)
  .then(_value => console.log(`✅ Success: ${_value}`))
  .else(error => console.log(`❌ Error: ${error}`));

console.log('\n7. Chaining with other operations:');
const arrayResult = success([1, 2, 3, 4, 5]);
arrayResult
  .if(array => array.length > 3)
  .then(array => {
    console.log(`📊 Large array with ${array.length} elements`);
    const sum = array.reduce((a, b) => a + b, 0);
    console.log(`🧮 Sum of elements: ${sum}`);
    const evens = array.filter(x => x % 2 === 0);
    console.log(`🔢 Even numbers found: ${evens.join(',')}`);
  })
  .else(array => console.log(`📊 Small array with ${array.length} elements`));

console.log('\n8. Nested validations:');
const productResult = success({
  name: 'Laptop',
  price: 1200,
  category: 'Electronics',
  stock: 5
});

productResult
  .if(product => product.price > 1000)
  .then(product => {
    console.log(`💻 ${product.name} is a premium product`);
    if (product.stock < 10) {
      console.log(`⚠️  ${product.name} has low stock (${product.stock} units)`);
    }
  })
  .else(product => console.log(`📱 ${product.name} is a standard product`));

console.log('\n=== Example 9: Chaining .map() before .if() ===');
// ✅ NOW IT WORKS! All Results have .if()
const numbersResult = success([1, 2, 3, 4, 5]);
const filteredResult = numbersResult
  .map(array => array.filter(x => x % 2 === 0))  // ← Returns Result<never, number[]>
  .if(array => array.length > 0)                 // ← Works! It's a Result!
  .then(array => console.log(`Array with ${array.length} even numbers:`, array))
  .else(() => console.log('No even numbers found'));

console.log('Chaining result:', filteredResult);

console.log('\n=== End of examples ===');
