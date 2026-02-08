# Tree Route Finder - Visual Guide

## Tree Structure Visualization

```
Route Tree Example:
┌─────────────────────────────────────────┐
│           Root (RouteTree)              │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
    users         api
      │             │
      ├── admin [H] │ (Static route)
      │             │
      └── :id       └── v1
           │              │
           ├── [H]        └── users
           │                    │
           └── posts [H]        └── :userId [H]

[H] = Handler present at this node
```

## Matching Process

### Example 1: `/users/admin`
```
Path: ["users", "admin"]

Step 1: Match "users"
  Root -> users ✓

Step 2: Match "admin"
  users node has:
    - "admin" (static) ✓ → MATCH FOUND
    - ":id" (dynamic) → NOT CHECKED (static found)

Result: Returns admin handler
```

### Example 2: `/users/123`
```
Path: ["users", "123"]

Step 1: Match "users"
  Root -> users ✓

Step 2: Match "123"
  users node has:
    - "admin" (static) → "admin" ≠ "123" ✗
    - ":id" (dynamic) → MATCHES ANY ✓

Result: Returns :id handler
```

### Example 3: `/users/123/posts`
```
Path: ["users", "123", "posts"]

Step 1: Match "users"
  Root -> users ✓

Step 2: Match "123"
  users -> :id ✓ (dynamic match)

Step 3: Match "posts"
  :id -> posts ✓

Result: Returns posts handler
```

## Priority Illustration

```
Given this structure:
users/
  ├── premium [H]     (Static)
  └── :userId [H]     (Dynamic)

Requests:
  GET /users/premium  → premium handler  (static wins)
  GET /users/123      → :userId handler  (dynamic fallback)
  GET /users/john     → :userId handler  (dynamic fallback)
```

## Algorithm Flow Chart

```
┌─────────────────────┐
│  Start with path    │
│  ["a", "b", "c"]    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pop first segment   │
│    currentPart      │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────┐
│  Is currentNode[currentPart] │
│        defined?              │
└──────┬──────────┬────────────┘
       │ YES      │ NO
       ▼          ▼
  ┌────────┐  ┌───────────────────┐
  │ Recurse│  │ Try dynamic routes│
  │  into  │  │   (":param")      │
  │  node  │  └─────────┬─────────┘
  └────┬───┘            │
       │                │
       ▼                ▼
  ┌─────────┐     ┌─────────┐
  │ Match?  │     │ Match?  │
  └────┬────┘     └────┬────┘
       │ YES           │ YES
       ▼               ▼
  ┌──────────────────────┐
  │   Return handler     │
  └──────────────────────┘
```

## Performance Characteristics

### Time Complexity
- **Best case**: O(d) where d is depth (direct path match)
- **Worst case**: O(d * k) where k is number of dynamic segments per level
- **Average case**: O(d) for most practical applications

### Space Complexity
- O(d) for recursion stack
- O(1) for each comparison

### Comparison

```
Route Tree Structure:
/api/users/123

Simple Linear Search:
  Check route 1: /api/posts      ✗
  Check route 2: /api/comments   ✗
  Check route 3: /api/users/:id  ✓
  → 3 comparisons

Tree-Based Search:
  Level 1: api ✓
  Level 2: users ✓
  Level 3: :id ✓
  → 3 comparisons (but O(1) per level)
```

## Edge Cases Handled

### 1. Handler at Intermediate Node
```
users/
  [H]                   ← Handler for /users
  └── :userId/
      [H]               ← Handler for /users/:userId
      └── posts [H]     ← Handler for /users/:userId/posts
```

### 2. Multiple Dynamic Segments
```
api/
  └── :version/         ← Matches first
      └── :id/          ← Then matches second
```

### 3. No Match Scenario
```
Path: /users/123/invalid
Tree only has: /users/:id/posts

Traversal:
  users ✓ → :id ✓ → invalid ✗
  
Result: Optionable.none()
```

## Implementation Details

### Key Functions

1. **isDynamic(segment: string): boolean**
   - Checks if segment starts with ':'
   - Used to identify dynamic routes

2. **isRouteHandler(value: any): boolean**
   - Type guard for route handlers
   - Checks for 'handleRequest' method

3. **traverse(node, parts): Optionable**
   - Recursive function
   - Maintains state through parameters
   - Returns on first match (greedy)

## Usage Pattern

```typescript
import { treeRouteFinder } from "@blazy/route-finders";
import { RouterObject } from "@blazy/backend-lib";

const router = RouterObject.empty(treeRouteFinder);

// Routes will now use tree-based matching
// with static routes prioritized over dynamic ones
```
