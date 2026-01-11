# Blazy Edge - Setup & Installation Guide

A modern HTTP stack framework built on Hono with TypeScript-first ergonomics for building web servers and APIs.

## Table of Contents
- [Local Setup for Development](#local-setup-for-development)
- [Forking & Contributing](#forking--contributing)
- [Installation](#installation)
- [Local vs NPM Resolution](#local-vs-npm-resolution)

## Local Setup for Development

### Prerequisites
- Bun 1.0+ (required - Bun-first framework)
- TypeScript 5.0+
- Git

### Initial Setup

1. **Clone the monorepo:**
   ```bash
   git clone <your-repo-url>
   cd diplomna-repo/main/project
   ```

2. **Install dependencies with Bun:**
   ```bash
   bun install
   ```

3. **Navigate to the package:**
   ```bash
   cd apps/backend-framework/core/blazy-edge
   ```

4. **Build the framework:**
   ```bash
   bun run build
   ```

### Development Workflow

- **Run tests:**
  ```bash
  bun test
  # or with watch mode
  bun test --watch
  ```

- **Type checking:**
  ```bash
  bun run tsc --noEmit
  ```

- **Linting & fixing:**
  ```bash
  bun run lint:fix
  ```

- **Development server (if available):**
  ```bash
  bun run dev
  ```

### File Structure
```
blazy-edge/
├── src/                          # Source files
│   ├── hooks/                    # Middleware and hooks
│   ├── middleware/               # Built-in middleware
│   ├── types/                    # TypeScript type definitions
│   └── index.ts                  # Main framework exports
├── tests/                        # Test files
├── examples/                     # Usage examples and patterns
├── index.ts                      # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Forking & Contributing

### Fork the Repository

1. **Click "Fork" on GitHub** to create your own copy

2. **Clone your fork locally:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/diplomna-repo.git
   cd diplomna-repo/main/project
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/diplomna-repo.git
   ```

4. **Keep your fork updated:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `apps/backend-framework/core/blazy-edge/src/` directory

3. **Test your changes:**
   ```bash
   npm test
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

## Installation

### Option 1: From NPM (Production)

Install as a dependency in your project:

```bash
npm install @blazy/http-stack
```

### Option 2: From Local Workspace (Development)

When working in the monorepo, the package is automatically available to other workspace packages using workspace protocol:

```json
{
  "devDependencies": {
    "@blazyts/backend-lib": "workspace:*"
  }
}
```

This is already configured in dependent packages within the monorepo.

### Option 3: From Git (Custom Branch)

Install directly from a Git branch:

```bash
npm install https://github.com/YOUR-USERNAME/diplomna-repo.git#main
```

Or with a specific branch:

```bash
npm install https://github.com/YOUR-USERNAME/diplomna-repo.git#feature/your-feature-name
```

## Local vs NPM Resolution

### When to Use Local Resolution

**Use workspace protocol (`workspace:*`)** when:
- 🔧 Developing the framework locally
- 🔗 Testing changes across multiple packages
- 🚀 Building features within the monorepo
- ⚡ Using Bun for faster development iteration

**Configuration in dependent package's `package.json`:**
```json
{
  "devDependencies": {
    "@blazyts/backend-lib": "workspace:*"
  }
}
```

### When to Use NPM Resolution

**Use NPM package** when:
- 📦 Publishing to production
- 🌐 Using the framework in external projects
- 🔒 Requiring a stable, published version
- 📍 Version pinning is important

**Installation:**
```bash
npm install @blazy/http-stack@^1.0.0
```

### Configuration for Both

To support both local and NPM resolution:

1. **In the framework's `package.json`:**
   - Ensure version is set: `"version": "1.0.0"`
   - Include build script for distribution

2. **Build for NPM before publishing:**
   ```bash
   cd apps/backend-framework/core/blazy-edge
   npm run build
   npm publish
   ```

3. **Use in other projects:**
   - **Local (monorepo):** `"@blazyts/backend-lib": "workspace:*"`
   - **External:** `"@blazy/http-stack": "^1.0.0"`

## Key Features

- **Template Hooks** - Layout management for HTML/JSX responses
- **Middleware Stack** - Composable middleware system
- **TypeScript-First** - Full TypeScript support with inference
- **Hono Integration** - Built on the fast Hono framework
- **Request/Response Handling** - Type-safe HTTP context
- **Pattern Matching** - Integrated with better-standard-library

## Usage Example

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Simple route
app.get('/', (c) => c.html('<h1>Hello World</h1>'));

// With middleware/hooks
app.use('*', yourMiddleware());

// Pattern matching
app.get('/user/:id', (c) => {
  const id = c.req.param('id');
  // Type-safe operations
  return c.json({ id });
});

export default app;
```

## Troubleshooting

### Import errors in editor
- Make sure you've run `npm install` in the monorepo root
- Check that TypeScript language server has reloaded (reload VS Code window)

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Check Bun version: `bun --version` (should be 1.0+)

### Tests failing
```bash
# Clean and reinstall
npm ci
# Run tests with verbose output
npm test -- --reporter=verbose
```

### TypeScript errors
- Check that `@blazyts/better-standard-library` is installed
- Run `npm install` from the monorepo root to ensure workspace resolution

## Next Steps

- Read [README.md](./README.md) for features and hooks documentation
- Check [tests/](./tests/) directory to understand behavior
- Review [examples/](./examples/) for usage patterns
- Explore middleware in [src/middleware/](./src/middleware/)
