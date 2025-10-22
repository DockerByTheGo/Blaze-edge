# Expose Service

This feature allows you to pass an object and expose its public methods as endpoints.

## Basic Usage

By default:
- Every method will be a POST endpoint
- No validation is enforced (since there's no schema)
- If the object implements the `ICrudified` interface, it will be translated to appropriate HTTP verbs (still without validation)

## Method Guessing

You can enable method guessing by passing the `guess` flag as a second argument. This will:
- Make methods with "get" in their name respond to GET requests
- Make methods with "create" or "post" in their name respond to POST requests
- And so on for other HTTP methods

## Validation with ObjectBuilder

To enforce validation, use the `ObjectBuilder`:

```typescript
ObjectBuilder.new({docs: ""})
  .addPrivateProperty("name-of-property", property)
  .addPrivateMethod(internalCtx => { 
    /* internalCtx contains name of property, all properties, and all previously defined methods */
  }, {docs: "Documentation for this method"})
  .addPublicMethod(
    "methodName", 
    z.object({/* validation schema */}), 
    ({internalCtx, arg}) => {
      // Implementation
    }, 
    {docs: "Documentation for this endpoint"}
  )
```

This approach allows for:
- Input validation
- Documentation generation
- Type safety
- Clear separation of public and private methods
