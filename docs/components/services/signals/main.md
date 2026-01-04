
## Signals

Our typesafe pub sub solution

This is a typesafe utility whuch allows you to degine signals. You can get all available signals using app.services.signalsManager.addListener()
Typesafety on bith the name and the data object. It is better to use our signals than your own since they are typesafe with minimal cpde and no explicit code s.g. no `as ...` assignements whuch might break code without the compiler knowing and also expose hooks. It also comes woth a typesafe emitter

### Hooks

OnSignalRegistered

OnSignalPublished

All hooks support the pipe system as always

### Management panel