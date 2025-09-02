import { success, failure, Result } from '../src/result';

// Exemplo de uso dos métodos .if().then().else() com controle condicional
console.log('=== Exemplos de uso dos métodos .if().then().else() ===\n');

// Exemplo 1: Controle condicional simples
console.log('1. Controle condicional simples:');
const numberResult = success(15);
numberResult
  .if(value => value > 10)
  .then(value => console.log(`✅ Número ${value} é maior que 10`))
  .else(value => console.log(`❌ Número ${value} é menor ou igual a 10`));

console.log('\n2. Condição falsa:');
const smallNumber = success(5);
smallNumber
  .if(value => value > 10)
  .then(value => console.log(`✅ Número ${value} é maior que 10`))
  .else(value => console.log(`❌ Número ${value} é menor ou igual a 10`));

// Exemplo 3: Controle condicional com múltiplas ações
console.log('\n3. Controle condicional com múltiplas ações:');
const largeNumber = success(25);
largeNumber
  .if(value => value > 20)
  .then(value => {
    console.log(`🎯 ${value} é muito grande!`);
    console.log(`📊 ${value} está na faixa alta`);
  })
  .else(value => console.log(`📉 ${value} está na faixa baixa`));

// Exemplo 4: Trabalhando com objetos complexos
console.log('\n4. Trabalhando com objetos complexos:');
const userResult = success({ id: 1, name: 'João', age: 25, email: 'joao@email.com' });
userResult
  .if(user => user.age >= 18)
  .then(user => {
    console.log(`👤 ${user.name} é adulto`);
    console.log(`📧 Email: ${user.email}`);
  })
  .else(user => {
    console.log(`👶 ${user.name} é menor de idade`);
    console.log(`⚠️  Não pode receber emails`);
  });

// Exemplo 5: Validação de strings
console.log('\n5. Validação de strings:');
const textResult = success('hello world');
textResult
  .if(text => text.length > 10)
  .then(text => console.log(`📝 Texto longo: "${text}" (${text.length} caracteres)`))
  .else(text => console.log(`📝 Texto curto: "${text}" (${text.length} caracteres)`));

// Exemplo 6: Tratamento de erros (Failure sempre executa .else)
console.log('\n6. Tratamento de erros (Failure sempre executa .else):');
const errorResult = failure('Erro de conexão com o banco');
errorResult
  .if(_value => true)
  .then(_value => console.log(`✅ Sucesso: ${_value}`))
  .else(error => console.log(`❌ Erro: ${error}`));

// Exemplo 7: Encadeamento com outras operações
console.log('\n7. Encadeamento com outras operações:');
const dataResult = success([1, 2, 3, 4, 5]);

// Primeira validação
dataResult
  .if(array => array.length > 3)
  .then(array => {
    console.log(`📊 Array grande com ${array.length} elementos`);
    const sum = array.reduce((a, b) => a + b, 0);
    console.log(`🧮 Soma dos elementos: ${sum}`);
  })
  .else(array => {
    console.log(`📊 Array pequeno com ${array.length} elementos`);
  });

// Segunda validação após transformação
const filteredArray = dataResult
  .map(array => array.filter(x => x % 2 === 0))
  .getOrElse([]);

if (filteredArray.length > 0) {
  console.log(`🔢 Números pares encontrados: ${filteredArray}`);
} else {
  console.log(`🔢 Nenhum número par encontrado`);
}

// Exemplo 8: Validações aninhadas
console.log('\n8. Validações aninhadas:');
const productResult = success({ name: 'Laptop', price: 1500, stock: 5 });

// Primeira validação
productResult
  .if(product => product.price > 1000)
  .then(product => {
    console.log(`💻 ${product.name} é um produto premium`);
    
    // Segunda validação aninhada
    if (product.stock > 10) {
      console.log(`📦 ${product.name} tem estoque alto`);
    } else {
      console.log(`⚠️  ${product.name} tem estoque baixo (${product.stock} unidades)`);
    }
  })
  .else(product => {
    console.log(`💰 ${product.name} é um produto acessível`);
  });

console.log('\n=== Exemplo 9: Chaining .map() antes de .if() ===');
// ✅ AGORA FUNCIONA! Todos os Results têm .if()
const numbersResult = success([1, 2, 3, 4, 5]);
const filteredResult = numbersResult
  .map(array => array.filter(x => x % 2 === 0))  // ← Retorna Result<never, number[]>
  .if(array => array.length > 0)                 // ← Funciona! É um Result!
  .then(array => console.log(`Array com ${array.length} números pares:`, array))
  .else(() => console.log('Nenhum número par encontrado'));

console.log('Resultado do chaining:', filteredResult);

console.log('\n=== Fim dos exemplos ===');
