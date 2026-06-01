# Contributing to PrivGuard

Thank you for your interest in contributing to PrivGuard! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/pploapp/PrivGuard.git
cd PrivGuard

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make changes** and add tests for your changes
4. **Run tests**: `pnpm test`
5. **Run lint**: `pnpm lint`
6. **Commit** with conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
7. **Push** to your fork
8. **Open a Pull Request** against the `main` branch

## Code Style

- TypeScript strict mode — no `as any` or `@ts-ignore`
- 2-space indentation
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- NestJS conventions for modules, controllers, and services

## Privacy & Security Considerations

Since PrivGuard handles personal data and privacy compliance:

- **Never log PII** in tests or debug output
- **Always encrypt** sensitive fields in the database layer
- **Follow GDPR principles** in any new features
- **Review security implications** before adding new data fields

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Build or tooling changes

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from a maintainer
4. Address review feedback

## Reporting Issues

- Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template for bugs
- Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template for new features
- **Security vulnerabilities**: Please do NOT open public issues. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.