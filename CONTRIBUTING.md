# Contributing to seiken-fx

First off, thank you for considering contributing to seiken-fx! 🎉 It's people like you that make seiken-fx such a great tool for functional programming in TypeScript.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful, inclusive, and constructive in all interactions.

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** with code snippets
- **Describe the expected vs actual behavior**
- **Include environment details** (TypeScript version, Node.js version, etc.)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **Include code examples** if applicable

### 🔧 Code Contributions

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Add tests** for your changes
5. **Update documentation** if needed
6. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- Node.js (18.x, 20.x, or 22.x)
- npm, yarn, or pnpm
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/seiken-fx.git
cd seiken-fx

# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Run type checking
npm run type-check

# Build the project
npm run build
```

### Available Scripts

```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
npm run build     # Build the library
npm run type-check # Run TypeScript type checking
npm run lint      # Run ESLint
npm run lint:fix  # Fix ESLint issues automatically
```

## 🔄 Pull Request Process

### Branch Naming Convention

Use descriptive branch names that indicate the type and scope of changes:

```
feat/add-new-utility-function
fix/resolve-type-inference-issue
docs/update-api-documentation
refactor/improve-error-handling
test/increase-coverage-for-array-utils
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```
feat(array): add flatMap utility function
fix(result): resolve type inference in map function
docs: update README with new examples
test(object): increase test coverage to 100%
```

### Pull Request Requirements

- [ ] **Tests pass**: All existing and new tests must pass
- [ ] **Type checking**: No TypeScript errors
- [ ] **Linting**: Code follows our ESLint rules
- [ ] **Documentation**: Update docs if you change APIs
- [ ] **Changelog**: Add entry if it's a user-facing change
- [ ] **Backward compatibility**: Don't break existing APIs without major version bump

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **At least one maintainer** must approve the PR
3. **All conversations** must be resolved
4. **Up-to-date** with the target branch

## 📏 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript**: Enable strict mode and avoid `any`
- **Explicit return types**: Always specify return types for public functions
- **Generic constraints**: Use proper generic constraints
- **Result-first philosophy**: All operations should use `Result<E, A>` for error handling

### Code Style

- **Prettier**: We use Prettier for code formatting
- **ESLint**: Follow our ESLint configuration
- **Functional programming**: Prefer pure functions and immutable data
- **No side effects**: Functions should not have side effects

### Example Code Style

```typescript
/**
 * Maps over an array with a function that returns a Result.
 * @param fn Function that transforms each element
 * @returns Function that takes an array and returns a Result
 */
export function map<T, U, E>(
  fn: (x: T) => Result<E, U>,
): (arr: readonly T[]) => Result<E, readonly U[]>;
export function map<T, U, E>(
  fn: (x: T) => Result<E, U>,
  arr: readonly T[],
): Result<E, readonly U[]>;
export function map<T, U, E>(fn: (x: T) => Result<E, U>, arr?: readonly T[]): any {
  // Implementation...
}
```

## 🧪 Testing Guidelines

### Test Requirements

- **100% coverage** for new code
- **Unit tests** for all public functions
- **Integration tests** for complex workflows
- **Type tests** for TypeScript behavior

### Test Structure

```typescript
describe('UtilityFunction', () => {
  describe('happy path', () => {
    it('should handle valid input correctly', () => {
      // Test implementation
    });
  });

  describe('error cases', () => {
    it('should return failure for invalid input', () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      // Test implementation
    });
  });
});
```

### Test Naming

- Use descriptive test names that explain the behavior
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks

## 📚 Documentation

### JSDoc Requirements

All public functions must have comprehensive JSDoc:

```typescript
/**
 * Brief description of what the function does.
 * 
 * @param param1 Description of parameter
 * @param param2 Description of parameter
 * @returns Description of return value
 * 
 * @example
 * ```typescript
 * const result = myFunction(input);
 * // Success(expectedOutput)
 * ```
 * 
 * @since 0.2.0
 */
```

### README Updates

When adding new features:
- Add examples to the README
- Update the feature list
- Include in the API reference section

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:
- **Environment details** (OS, Node.js version, TypeScript version)
- **Minimal reproduction** case
- **Expected vs actual** behavior
- **Stack traces** if applicable

### Feature Requests

Use the feature request template and include:
- **Use case description**
- **Proposed API** (if applicable)
- **Alternative solutions** considered
- **Code examples** of desired usage

## 🏷️ Labels

We use labels to categorize issues and PRs:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `typescript`: TypeScript-related changes
- `performance`: Performance improvements

## 🚀 Release Process

1. **Version bump** following [Semantic Versioning](https://semver.org/)
2. **Update CHANGELOG.md** with new features and fixes
3. **Create GitHub release** with release notes
4. **Publish to npm** automatically via CI/CD

## 🙋 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Code Review**: Don't hesitate to ask for feedback on PRs

## 🎉 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **CHANGELOG.md** for significant contributions
- **GitHub releases** acknowledgments

Thank you for contributing to seiken-fx! 🚀
