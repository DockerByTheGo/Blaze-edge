# Management Panel

A comprehensive interface for monitoring and managing your application.

## Features

### Inspect logs with filtering options
You can inspect all the logs from the logger service inside a designated editor. You can filter by source (also you can export your session so that it persits restarts). Also you can query the logs with an sql like editor 


### Endpoint Tester
- Test both WebSocket and HTTP endpoints
- View detailed request/response information
- Logs tab showing all performed requests
- Request invocation route visualization
- Service entity tracking for each request

### Backend Explorer
#### Visualize code structure

Describes the code in  graph like manner

It also grabs your jsdoc comments and displays them in the graph

##### View service relationships and dependencies

#### Directly invoke service methods from the GUI and see their responses


#### Code Structure Visualization
Example structure:
```
/
- users
  - get /:id
  - post /
  - friends
    - post /new
    - get  /
- admin
  - deleteApp
```

#### Filtering data
Filter by controllers and services:

```typescript
// View only users controller
const filter = {
  controllers: [{
    name: "users",
    showSubroutes: false
  }]
};

// Find routes using specific services
const serviceFilter = {
  services: {
    uses: ['userService', 'authService']
  }
};
```



### Active Connections
- Monitor all WebSocket connections
- View connection details and metrics
- Track message throughput

### History
View and query request history with SQL-like syntax:
```sql
WHERE REQ.IS_HTTP 
AND REQ.HEADERS.AUTHORIZATION_ATTEMPT > 10
```

The logger also supports an sql like syntaxis for quering 

### Code Explorer
Visualize relationships between components:
```
┌────────────────────┐
│   BookController   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│     BookService    │◄────────┐
└────────┬───────────┘         │
         │                     │
         ▼                     │
┌────────────────────┐         │
│   BookRepository   │         │
└────────┬───────────┘         │
         │                     │
         ▼                     │
      ┌───────┐                │
      │ Book  │◄───────────────┘
      └───────┘
```

## Enabling Code Explorer
Enable the code explorer in `middlewares/gui/main.ts`:
```typescript
ManagementPanel(["code-explorer"]) // Enable code explorer
```

## Extending the Panel
Easily add custom routes using JSX:
```typescript
app.extras.panel.addRoutes({
  route => <YourCustomComponent />
})
```
