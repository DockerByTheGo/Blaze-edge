# AddMicroservice

Similar to [AddService](../add-service/main.md) but creates a new isolated process for each microservice.

## Key Features
- Each microservice runs in its own isolated process
- Manage all microservices from a single project
- Full intellisense support for microservice methods
- Automatic process management
- Built-in inter-process communication
- Process isolation improves stability and reliability

## How It Works
When you add a microservice using `addMicroservice()`, the framework:
1. Spawns a new Node.js process
2. Sets up communication channels between processes
3. Proxies method calls between the main process and microservice
4. Handles process lifecycle management
5. Provides type safety across process boundaries

## Use Cases
- CPU-intensive tasks that would block the main event loop
- Isolating critical services for better fault tolerance
- Independent scaling of different parts of your application
- Running services with different resource requirements
- Implementing the microservices architecture pattern

## Example
```typescript
// In your main application
const paymentService = await addMicroservice({
  name: 'payment-service',
  path: './services/payment-service.js',
  // Other configuration options
});

// Use the service with full intellisense
const result = await paymentService.processPayment({
  amount: 100,
  currency: 'USD',
  // ...
});
```
