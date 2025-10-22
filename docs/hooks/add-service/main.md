# AddService

Adds a microservice to your app, making it accessible throughout your application.

## Basic Usage

```typescript
addService(service: Service)
```

## Features

### Hooks
When a service is added, you get access to these hooks:
- `onQueried(method, dataPassedToMethod, ReturnOfMethod)`
- `onAdded(serviceObj)` - When the service is first added

### Accessing Services

#### Global Subscription
```typescript
Services.global.onAdded((name, object) => {
  // name and object are typed for intellisense
})
```

#### Service-Specific Subscription
```typescript
services.[name].onQueried(method => {
  // Handle when any method is called
})

services.[name].onInitialized(() => {
  // Handle service initialization
})

// Hook into specific methods
services.[name].onCreate(data => {
  // Type-safe access to method parameters
})
```

## Use Case Example

Imagine you have:
- A general backend
- A job runner with a video processing endpoint

Instead of manually generating a client and managing references, you can:
1. Create the service using a `Service` template (like `HttpServer`)
2. Define its structure
3. Include it using `addService()`
4. Get full intellisense support throughout your application
