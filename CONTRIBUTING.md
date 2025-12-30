# Contributing to Figma-to-Code Agent

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guide](#style-guide)

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something great together.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- A Figma account (for testing)
- An Anthropic API key (for AI features)

### Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/figma-to-code-agent.git
cd figma-to-code-agent
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev -- convert "figma-url"
```

## Project Structure

```
src/
├── agent/              # Main orchestrator
│   └── figma-agent.ts  # FigmaToCodeAgent class
├── ai/                 # AI integration
│   └── claude-client.ts # Claude API client
├── figma/              # Figma API
│   └── client.ts       # Figma REST client
├── generators/         # Code generators
│   ├── component-generator.ts
│   ├── style-generator.ts
│   └── test-generator.ts
├── parser/             # Design parsing
│   └── design-parser.ts
├── types/              # TypeScript types
│   ├── figma.ts        # Figma API types
│   └── generator.ts    # Generator types
├── cli.ts              # CLI entry point
└── index.ts            # Library entry point

docs/                   # Documentation
examples/               # Example components
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(parser): add support for Figma variants
fix(generator): handle empty children array
docs(api): update FigmaClient documentation
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npm test -- design-parser

# With coverage
npm test -- --coverage
```

### Writing Tests

Tests should be placed next to the source file:
```
src/parser/design-parser.ts
src/parser/design-parser.test.ts
```

Test file structure:
```typescript
import { DesignParser } from './design-parser';

describe('DesignParser', () => {
  describe('parseNode', () => {
    it('should parse text nodes', () => {
      // Arrange
      const parser = new DesignParser();
      const node = { ... };

      // Act
      const result = parser.parseNode(node);

      // Assert
      expect(result.type).toBe('text');
    });
  });
});
```

### Test Coverage

We aim for high test coverage:
- Unit tests for all public methods
- Integration tests for the agent
- Edge case coverage

## Submitting Changes

### Before Submitting

1. **Run tests**: `npm test`
2. **Build**: `npm run build`
3. **Lint**: `npm run lint`
4. **Update docs** if needed

### Pull Request Process

1. Push your branch:
   ```bash
   git push origin feature/your-feature
   ```

2. Create a Pull Request on GitHub

3. Fill out the PR template:
   - Description of changes
   - Related issues
   - Testing done
   - Screenshots (if UI changes)

4. Wait for review

### PR Review Checklist

- [ ] Tests pass
- [ ] Build succeeds
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over type aliases
- Use explicit return types on public methods
- Avoid `any` - use `unknown` or proper types

```typescript
// Good
export function parseNode(node: FigmaNode): ParsedComponent {
  ...
}

// Avoid
export function parseNode(node: any): any {
  ...
}
```

### Naming Conventions

- **Files**: kebab-case (`design-parser.ts`)
- **Classes**: PascalCase (`DesignParser`)
- **Functions**: camelCase (`parseNode`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DEPTH`)
- **Interfaces**: PascalCase with descriptive names (`ParsedComponent`)

### Code Organization

- One class per file
- Export types from `types/` directory
- Keep functions focused and small
- Use comments for complex logic

### Documentation

- Document public APIs with JSDoc
- Include examples in comments
- Update README for new features

```typescript
/**
 * Parses a Figma node into a ParsedComponent structure.
 *
 * @param node - The Figma node to parse
 * @param depth - Current recursion depth (default: 0)
 * @returns The parsed component structure
 *
 * @example
 * const parser = new DesignParser();
 * const component = parser.parseNode(figmaNode);
 */
parseNode(node: FigmaNode, depth: number = 0): ParsedComponent {
  ...
}
```

## Areas for Contribution

### Good First Issues

- Improve error messages
- Add more component type detection
- Enhance Tailwind class generation
- Add more test cases

### Feature Ideas

- Support for more styling approaches
- Animation detection
- Responsive breakpoints
- Component variants
- Storybook generation

### Documentation

- Improve examples
- Add tutorials
- Translate documentation
- API documentation

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
