# GitHub Actions Setup

## Required Secrets

Para que o pipeline de CI/CD funcione corretamente, você precisa configurar os seguintes secrets no seu repositório GitHub:

### 1. NPM_TOKEN

1. Acesse [npmjs.com](https://www.npmjs.com/) e faça login
2. Vá em **Profile Settings** → **Access Tokens**
3. Clique em **Generate New Token** → **Classic Token**
4. Selecione **Automation** ou **Publish** scope
5. Copie o token gerado

No GitHub:
1. Vá no seu repositório → **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Nome: `NPM_TOKEN`
4. Value: Cole o token do npm
5. Clique em **Add secret**

### 2. GITHUB_TOKEN

Este token é fornecido automaticamente pelo GitHub Actions, não precisa configurar.

## Como o Pipeline Funciona

### CI (Continuous Integration)
- Roda nos pushes para `main` e `develop`
- Roda nos Pull Requests para `main`
- Testa em múltiplas versões do Node.js (18.x, 20.x)
- Executa: lint, testes, coverage, build
- Envia coverage para Codecov

### Release & Publish
- Roda apenas em pushes para `main`
- Verifica se a versão no package.json mudou
- Se mudou:
  - Cria uma tag Git
  - Publica no npm
  - Cria uma release no GitHub

## Comandos Locais

```bash
# Rodar testes
npm test

# Rodar testes com coverage
npm run test:coverage

# Lint
npm run lint

# Build
npm run build

# Simular prepublish
npm run prepublishOnly
```

## Workflow de Release

1. Faça suas mudanças em uma branch
2. Abra um PR para `main`
3. O CI vai rodar automaticamente
4. Após aprovação, faça merge para `main`
5. Atualize a versão no `package.json`:
   ```bash
   npm version patch  # para bug fixes
   npm version minor  # para features
   npm version major  # para breaking changes
   ```
6. Commit e push para `main`
7. O pipeline de release vai rodar automaticamente
8. Sua nova versão será publicada no npm! 🚀

## Coverage

O coverage é enviado automaticamente para [Codecov](https://codecov.io/). 
Você pode adicionar o badge de coverage no README se quiser mostrar a porcentagem de cobertura.
