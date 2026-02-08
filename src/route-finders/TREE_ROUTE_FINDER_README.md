# Tree Route Finder

A tree-based route finder implementation that efficiently matches URL paths using a tree structure, with smart handling of static and dynamic routes.

## Features

### 1. **Tree Structure Navigation**
The route finder traverses a tree data structure where each node represents a path segment. This allows for efficient nested route matching.

### 2. **Static vs Dynamic Routes**
- **Static routes**: Exact string matches (e.g., `/users/admin`)
- **Dynamic routes**: Parameterized segments starting with `:` (e.g., `/users/:id`)

### 3. **Priority System**
When both a static route and a dynamic route exist at the same level, the **static route takes priority**. This ensures that hardcoded routes like `/users/admin` will match before dynamic patterns like `/users/:id`.

## How It Works

```typescript
import { treeRouteFinder } from "./route-finders";

const routes = {
  users: {
    admin: adminHandler,        // Static: /users/admin
    ":id": userByIdHandler,     // Dynamic: /users/:id
  },
};

// When matching /users/admin:
// 1. Checks "admin" (static) → MATCH ✓
// 2. Never checks ":id" (dynamic) because static matched

// When matching /users/123:
// 1. Checks "admin" (static) → No match
// 2. Checks ":id" (dynamic) → MATCH ✓
```

## Algorithm

The tree route finder uses a depth-first search algorithm with the following logic:

1. **Split the path** into segments (e.g., `/users/123/posts` → `["users", "123", "posts"]`)

2. **For each segment:**
   - First, try to find an exact (static) match in the current tree node
   - If found, recursively traverse into that subtree
   - If not found, check all dynamic segments (those starting with `:`)
   - Try each dynamic segment until a match is found

3. **When all segments are processed:**
   - Check if the current node is a route handler
   - If yes, return it; if no, return none

4. **Priority order at each level:**
   ```
   Static routes → Dynamic routes
   ```

## Example Usage

```typescript
const routeTree = {
  api: {
    v1: {
      users: {
        list: listUsersHandler,           // /api/v1/users/list
        ":userId": {
          ...getUserHandler,               // /api/v1/users/:userId
          posts: userPostsHandler,         // /api/v1/users/:userId/posts
        },
      },
    },
  },
};

const path = new Path("/api/v1/users/123/posts");
const handler = treeRouteFinder(routeTree, path);

if (handler.isSome()) {
  const result = handler.unpack().map(h => h(request));
  // Handles the request with userPostsHandler
}
```

## Benefits

1. **Efficient**: O(n) time complexity where n is the number of path segments
2. **Predictable**: Clear priority system (static before dynamic)
3. **Type-safe**: Integrates with TypeScript route definitions
4. **Flexible**: Supports arbitrary nesting of routes
5. **Intuitive**: Matches developer expectations about route specificity

## Comparison with Simple Route Finder

| Feature | Simple Route Finder | Tree Route Finder |
|---------|---------------------|-------------------|
| Structure | Linear list | Tree hierarchy |
| Static priority | ❌ | ✓ |
| Nested routes | Limited | Full support |
| Performance | O(n*m) routes | O(d) depth |
| Dynamic/Static mix | ❌ | ✓ |

## Edge Cases

### 1. Multiple Dynamic Routes
If multiple dynamic routes exist at the same level, the first one encountered will match.

### 2. Root Route Handlers
A route handler can exist at any level, including intermediate nodes:
```typescript
{
  users: {
    ...listUsersHandler,  // Handles /users
    ":id": userHandler,   // Handles /users/:id
  }
}
```

### 3. Empty Path
An empty path (after split) will check if the root node is a handler.

## Type Safety

The route finder is fully typed and works with the existing `RouteFinder` interface:

```typescript
export type RouteFinder<TRoutes extends RouteTree> = 
  (routes: TRoutes, path: Path<string>) => Optionable<((req: Request) => unknown)>
```

This ensures compile-time safety for route definitions and handlers.
