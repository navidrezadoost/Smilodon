# Contributing to Smilodon

Thank you for your interest in contributing to Smilodon! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at support@smilodon.dev. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x (LTS versions)
- **npm**: v9.x or higher
- **Git**: v2.x or higher
- **Chrome/Chromium**: Latest version (for E2E tests)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/navidrezadoost/smilodon.git
cd smilodon

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/smilodon.git
cd smilodon

# Add upstream remote
git remote add upstream https://github.com/navidrezadoost/smilodon.git
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Verify installation
npm run build
npm test
```

### 3. Configure IDE

#### VS Code (Recommended)

Install recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Playwright Test for VSCode

Workspace settings are included in `.vscode/settings.json`.

#### WebStorm/IntelliJ

Enable:
- TypeScript support
- ESLint integration
- Prettier integration

---

## Project Structure

```
smilodon/
├── packages/                 # Package workspace
│   ├── core/                # @smilodon/core - Core Web Components
│   │   ├── src/
│   │   │   ├── components/  # Component implementations
│   │   │   ├── renderers/   # Virtual scroll renderers
│   │   │   ├── utils/       # Utility functions
│   │   │   └── types.ts     # TypeScript types
│   │   └── tests/           # Unit tests
│   ├── react/               # @smilodon/react - React wrapper
│   ├── vue/                 # @smilodon/vue - Vue wrapper
│   ├── svelte/              # @smilodon/svelte - Svelte wrapper
│   ├── angular/             # @smilodon/angular - Angular wrapper
│   └── vanilla/             # @smilodon/vanilla - Vanilla JS package
├── playground/              # Development playground
│   ├── vanilla-demo.html    # Vanilla demo (E2E test target)
│   ├── react-demo.html      # React examples
│   ├── vue-demo.html        # Vue examples
│   └── svelte-demo.html     # Svelte examples
├── tests/                   # E2E and contract tests
│   ├── e2e/                 # Playwright E2E tests
│   │   └── scenarios/       # Test scenarios
│   └── contracts/           # Framework contract tests
├── docs/                    # Documentation
│   ├── compliance/          # Compliance documentation
│   └── *.md                 # Technical docs
└── scripts/                 # Build and utility scripts
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements
- `perf/` - Performance improvements

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) section below.

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:e2e           # E2E tests
npm run test:contracts     # Contract tests

# Watch mode for development
npm run test:unit:watch
```

### 4. Build Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:react
npm run build:vue
```

### 5. Test in Playground

```bash
# Start development servers
npm run dev:vanilla        # Port 5173
npm run dev:react          # Port 5174
npm run dev:vue            # Port 5175
npm run dev:svelte         # Port 5176
npm run dev:angular        # Port 5177
```

### 6. Commit Changes

Follow the [Commit Guidelines](#commit-guidelines) section.

```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(core): add new feature"
```

### 7. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

---

## Coding Standards

### TypeScript

#### Style Guide

```typescript
// ✅ Good: Explicit types, clear naming
interface SelectItem {
  value: string | number;
  label: string;
  disabled?: boolean;
}

function renderItem(item: SelectItem): HTMLElement {
  const element = document.createElement('div');
  element.className = 'option-container';
  element.textContent = item.label;
  return element;
}

// ❌ Bad: Implicit any, unclear naming
function render(x: any) {
  const e = document.createElement('div');
  e.textContent = x.label;
  return e;
}
```

#### Rules

- **Type Safety**: No `any` types without justification
- **Strictness**: Enable strict mode (`strict: true`)
- **Naming**: 
  - PascalCase for types/interfaces/classes
  - camelCase for functions/variables
  - UPPER_CASE for constants
- **Exports**: Prefer named exports over default exports
- **Comments**: Use TSDoc for public APIs

```typescript
/**
 * Renders a virtual scrolling container for large datasets.
 * 
 * @param items - Array of items to render
 * @param config - Virtual scroll configuration
 * @returns Virtual scroll container element
 * 
 * @example
 * ```ts
 * const container = renderVirtualScroll(items, {
 *   itemHeight: 48,
 *   buffer: 10
 * });
 * ```
 */
export function renderVirtualScroll<T>(
  items: T[],
  config: VirtualScrollConfig
): HTMLElement {
  // Implementation
}
```

### JavaScript/HTML/CSS

#### Web Components

```typescript
// ✅ Good: Shadow DOM with proper encapsulation
class EnhancedSelect extends HTMLElement {
  private shadow: ShadowRoot;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }
  
  disconnectedCallback(): void {
    this.cleanup();
  }
}
```

#### CSS

```css
/* ✅ Good: BEM naming, CSS variables */
.select-container {
  --select-bg: var(--custom-bg, #ffffff);
  background: var(--select-bg);
}

.select-container__input {
  padding: 8px 12px;
}

.select-container__input--focused {
  border-color: var(--select-focus-color);
}

/* ❌ Bad: Generic names, hard-coded values */
.container {
  background: #fff;
}

.input {
  padding: 8px;
}
```

### Code Organization

#### File Structure

```typescript
// Component file structure
import { dependencies } from 'external';
import { internal } from './utils';

// Types
interface ComponentProps {
  // ...
}

// Constants
const DEFAULT_CONFIG = {
  // ...
};

// Main class/function
export class Component {
  // Properties
  private state: State;
  
  // Constructor
  constructor(props: ComponentProps) {
    // ...
  }
  
  // Public methods
  public render(): void {
    // ...
  }
  
  // Private methods
  private handleEvent(): void {
    // ...
  }
}

// Helper functions
function helperFunction(): void {
  // ...
}
```

### Performance

- **Avoid unnecessary re-renders**: Use memoization
- **Debounce expensive operations**: User input, scrolling
- **Use Web Workers**: For heavy computations
- **Virtual scrolling**: For large lists (always)
- **RequestAnimationFrame**: For smooth animations

```typescript
// ✅ Good: Debounced search
const debouncedSearch = debounce((query: string) => {
  this.filterItems(query);
}, 300);

// ✅ Good: RAF for smooth scrolling
requestAnimationFrame(() => {
  this.updateVisibleItems();
});

// ✅ Good: Web Worker for sorting
this.worker.execute('sortItems', items).then(sorted => {
  this.updateItems(sorted);
});
```

### Security

- **No `eval()`**: Never use `eval()` or `Function()` constructors
- **Sanitize HTML**: Use DOMPurify for user-generated content
- **CSP compliance**: All code must work with strict CSP
- **Input validation**: Validate all user inputs
- **XSS prevention**: Escape output, use textContent over innerHTML

```typescript
// ✅ Good: Safe content insertion
element.textContent = userInput;

// ✅ Good: Sanitized HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// ❌ Bad: XSS vulnerability
element.innerHTML = userInput;
```

---

## Testing Requirements

### Unit Tests

**Coverage Requirements:**
- Minimum 80% code coverage
- 100% coverage for critical paths (selection, rendering)
- Test edge cases and error conditions

**Testing Framework:** Vitest

```typescript
// Example unit test
import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedSelect } from '../src/components/enhanced-select';

describe('EnhancedSelect', () => {
  let select: EnhancedSelect;
  
  beforeEach(() => {
    select = new EnhancedSelect();
    document.body.appendChild(select);
  });
  
  it('should render items correctly', () => {
    const items = [
      { value: 1, label: 'Item 1' },
      { value: 2, label: 'Item 2' }
    ];
    
    select.setItems(items);
    
    expect(select.items).toHaveLength(2);
    expect(select.items[0].label).toBe('Item 1');
  });
  
  it('should handle empty items array', () => {
    select.setItems([]);
    expect(select.items).toHaveLength(0);
  });
});
```

### E2E Tests

**Testing Framework:** Playwright

**Requirements:**
- Test user interactions (click, keyboard, touch)
- Test across browsers (Chrome, Firefox, Safari)
- Test shadow DOM interactions properly
- Use page object pattern for maintainability

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test.describe('Basic Selection', () => {
  test('should select item on click', async ({ page }) => {
    await page.goto('http://localhost:5173/vanilla-demo.html');
    
    const select = page.locator('enhanced-select');
    
    // Open dropdown (shadow DOM)
    await select.evaluate((el: HTMLElement) => {
      const input = el.shadowRoot?.querySelector('input');
      input?.focus();
    });
    
    // Click option (shadow DOM)
    await select.evaluate((el: HTMLElement) => {
      const option = el.shadowRoot
        ?.querySelector('select-option');
      const container = option?.shadowRoot
        ?.querySelector('.option-container');
      (container as HTMLElement)?.click();
    });
    
    // Verify selection
    const selectedCount = await select.evaluate((el: any) => 
      el.getSelectedCount()
    );
    
    expect(selectedCount).toBe(1);
  });
});
```

### Contract Tests

Test framework wrapper compatibility:

```typescript
// Example contract test for React
import { render } from '@testing-library/react';
import { Select } from '@smilodon/react';

test('React Select renders correctly', () => {
  const items = [{ value: 1, label: 'Item 1' }];
  
  const { container } = render(<Select items={items} />);
  
  const select = container.querySelector('enhanced-select');
  expect(select).toBeInTheDocument();
});
```

### Performance Tests

**Requirements:**
- Test render time for various dataset sizes
- Test memory usage
- Test scroll FPS
- Compare against benchmarks

```typescript
// Example performance test
test('should render 10000 items in < 50ms', async () => {
  const items = generateItems(10000);
  
  const startTime = performance.now();
  select.setItems(items);
  await select.updateComplete;
  const endTime = performance.now();
  
  const renderTime = endTime - startTime;
  expect(renderTime).toBeLessThan(50);
});
```

### Accessibility Tests

**Requirements:**
- Test keyboard navigation
- Test screen reader announcements
- Test focus management
- Test ARIA attributes

```typescript
// Example accessibility test
test('should have proper ARIA attributes', () => {
  const input = select.shadowRoot?.querySelector('input');
  
  expect(input?.getAttribute('role')).toBe('combobox');
  expect(input?.getAttribute('aria-expanded')).toBe('false');
  expect(input?.hasAttribute('aria-controls')).toBe(true);
});
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Specific test file
npx vitest run packages/core/tests/smoke.spec.ts

# Watch mode
npm run test:unit:watch

# Coverage report
npm run test:coverage

# E2E with UI mode (debugging)
npx playwright test --ui
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, configs)

### Scopes

- `core` - Core package
- `react` - React package
- `vue` - Vue package
- `svelte` - Svelte package
- `angular` - Angular package
- `vanilla` - Vanilla package
- `playground` - Playground
- `docs` - Documentation
- `tests` - Tests

### Examples

```bash
# Feature
feat(core): add infinite scroll support

Implemented infinite scroll with configurable page size and
threshold. Includes loading indicators and automatic pagination.

Closes #123

# Bug fix
fix(react): resolve shadow DOM focus issue in multi-select

Fixed blur event causing dropdown to close when clicking options
in shadow DOM. Updated event delegation to handle shadow boundaries.

Fixes #456

# Documentation
docs(readme): add performance benchmarks section

Added comprehensive performance benchmarks with competitor
comparison and real-world data.

# Breaking change
feat(core)!: remove deprecated NativeSelect component

BREAKING CHANGE: NativeSelect component removed. Use EnhancedSelect
with legacy config instead.

Migration guide: docs/MIGRATION.md#native-select-removal
```

### Commit Message Rules

1. **Subject line**:
   - Use imperative mood ("add" not "added" or "adds")
   - Don't capitalize first letter
   - No period at the end
   - Maximum 72 characters

2. **Body**:
   - Separate from subject with blank line
   - Wrap at 72 characters
   - Explain *what* and *why*, not *how*
   - Reference issues/PRs

3. **Footer**:
   - Reference breaking changes
   - Link to issues: `Closes #123`, `Fixes #456`

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with main
- [ ] Build passes locally
- [ ] Performance not degraded

```bash
# Pre-submission checks
npm run build         # All packages build
npm test              # All tests pass
npm run lint          # No lint errors
npm run type-check    # No type errors
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance validated

## Related Issues
Closes #123

## Screenshots (if applicable)
[Add screenshots]

## Performance Impact
[Describe any performance implications]
```

### Review Process

1. **Automated Checks**: CI must pass
   - Unit tests
   - E2E tests
   - Linting
   - Type checking
   - Build verification

2. **Code Review**: At least one approval required
   - Maintainer reviews code quality
   - Tests adequacy verified
   - Performance impact assessed
   - Documentation completeness checked

3. **Merge**: Squash and merge strategy
   - PR commits squashed into single commit
   - Conventional commit format enforced
   - Clean git history maintained

### Review Timeframe

- **Simple fixes**: 1-2 days
- **Features**: 3-5 days
- **Breaking changes**: 1-2 weeks

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address review feedback"
git push origin feature/your-feature
```

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

**Maintainers only:**

1. **Update Version**
   ```bash
   npm version major|minor|patch
   ```

2. **Update Changelog**
   - Move "Unreleased" to new version
   - Add release date
   - Document all changes

3. **Run Full Test Suite**
   ```bash
   npm test
   npm run test:e2e
   npm run test:contracts
   ```

4. **Build All Packages**
   ```bash
   npm run build
   npm run size  # Verify bundle sizes
   ```

5. **Tag Release**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

6. **Publish to npm**
   ```bash
   npm publish --access public
   ```

7. **Create GitHub Release**
   - Go to GitHub Releases
   - Create release from tag
   - Copy changelog entry
   - Upload build artifacts

### Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Monthly (first Tuesday)
- **Major releases**: Quarterly (with migration period)

---

## Getting Help

### Documentation

- [README](./README.md) - Project overview
- [Getting Started](./docs/GETTING-STARTED.md) - Quick start guide
- [API Reference](./docs/API-REFERENCE.md) - Complete API docs
- [Testing Guide](./docs/TESTING-GUIDE.md) - Testing patterns

### Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, help
- **Email**: navidrezadoost07@gmail.com

### First-Time Contributors

Look for issues labeled:
- `good first issue` - Easy issues for beginners
- `help wanted` - Issues needing contributors
- `documentation` - Documentation improvements

---

## Recognition

Contributors are recognized in:
- GitHub contributors graph
- Release notes
- CONTRIBUTORS.md file

Thank you for contributing to Smilodon! 🦷
