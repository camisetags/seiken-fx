---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: ['bug']
assignees: ''
---

## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 💻 Code Example

```typescript
// Provide a minimal code example that reproduces the issue
import { map, success } from 'seiken-fx';

const result = map((x: number) => success(x * 2))([1, 2, 3]);
// Expected: Success([2, 4, 6])
// Actual: Error or unexpected behavior
```

## 🌍 Environment

- **OS**: [e.g. macOS 14.0, Windows 11, Ubuntu 22.04]
- **Node.js version**: [e.g. 18.17.0]
- **TypeScript version**: [e.g. 5.2.2]
- **seiken-fx version**: [e.g. 0.2.1]
- **Package manager**: [e.g. npm 9.8.1, yarn 1.22.19]

## 📝 Additional Context

Add any other context about the problem here, such as:
- Error messages or stack traces
- Screenshots (if applicable)
- Related issues or discussions
- Workarounds you've tried

## ✅ Checklist

- [ ] I have searched for existing issues that might be related
- [ ] I have provided a minimal code example that reproduces the issue
- [ ] I have included all relevant environment information
- [ ] I have tested this with the latest version of seiken-fx
