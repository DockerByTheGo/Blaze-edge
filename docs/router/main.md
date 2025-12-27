# Router

it supports all the options from the @core library and more

## Caching

### Basics

#### Local and global

Most options support both options and if a local and global is defined the local will override the global

you can set cache to true and it gets added into the cache regsitry from which you can later invalidate

for example imagine we expose a user router which has delete and get if we get all users once and no mutations have been erformed on the data there is no need to rerun all the handler code for this we can just save the response and later reuse it but if a chnage has occured we would want to run the handler again

here is how we do it in code

Note supplying an empty object is enough to turn the cache on, if you want to explicitley turn it off use `cache: {disable: ["active"]}`

```ts
app.get("/", ctx => {... /* code for the handler*/}, {cache: {}})

app.delete("/", ctx => {
    // ... perform some code here
    ctx.cache.users.get.invalidate() // like that we say that the cached version is no longer valid, behind the scenes we just set the entry to null
})
```

### Hooks

the cache service supports the following hooks
`onRegistered(ctx => void)` runs whenever the {cache: ...} is added to a route handler, the ctx is the `Handler object`
`onFirstEntry(ctx => void)` runs whenever an entry has been populated for the. ctx is the data it has recieved for the entry plus the Handler object for which the cache was changed
`onChanged(ctx => void)` runs whenever the an entry has been changed, ctx is the same as onFirstEntry, if users says it is needed in the future it will provide also which in order change is it, e,g, first chnage, second change and so on, iit is hookd directly to the set method so it unrs whenever set is called no matter where
`onInvalidated(ctx => void) ` runs whenver a cache is invalidated and the ctx is the entry which was invalidated and the `Handler Object`

### Service level caching

Since we are a `multi-protocol-framework` and sometimes you want to expose the same service from mutliple protocols you might want to cache services too. You can do this by using the `cachify` utility on an existing or already added service. It supports all the options as the route cacher

!Note: It works on a per service level e.g. it modifies the result which the service methods return so be careful with it

#### Usage

##### When adding new service

app.services.add(Cachify(your-service))

##### When using an already added service and cant modify the code for adding (for example when you want to add cache to an internal service of a subapp from a 3rd party package)

app.services.<your-service/>.transform(v => Cachify(v))

### How it works

when you add the `{cache:{ }}` internally the app starts keeping track of its responses. When a request for a route which has this enabled the app checks if the entry is null if it is it runs the handler and calls cache.<route-id/>.set(<result-of-the-handler/>) and if it is not it retuns the stored cache entry. when you call cache.<route-id/>.invalidate behind the scenes it runs cache.<route-id/>.set(null).

### cache service object

#### root methods

.invalidateAllExcept() // accepts groups and ids
.invalidate() // accepts groups and ids
.getFromGroup()
.getAll() -> {Groups: Record[GroupName, ids], Ids: string[]}

#### <group/>

methods

example cache.<group/>[Symbol]

.invalidate()
.getAll()
.add() // id or group if a group is supplied it calls getAll on the group for the ids

### Additional options

#### One-Time Cache Entries

##### Global and local

local overwrites global if defined

###### Global

app.cache.config.enable("one-time-response")

###### local

app.get("/ooo", h, {cache: {enabled: ["one-time-response"]}})

#### Per-Key Caching (e.g. per user or param-based)

##### Global and local

Allow caching entries based on parameters like user ID, query strings, or body fields. like that you replace the key used for identyfying the cache from the def. If a global and local is defined the local overwrites the global

app.get("/users/:id", ctx => {
// logic to fetch user
}, {
cache: {
key: ctx => ctx.params.id // unique cache key per user ID
}
});

by default the key for a cache is a compressed version of the whole request

e.g.

```ts
cache: {
  key: ctx => compress(JSON.stringify(ctx.req));
}
```

Why?
It prevents cache collisions and allows fine-grained control — useful for dynamic or user-specific data.

#### TTL (Time-To-Live) Support

Automatically expire entries after a certain time.

app.get("/stats", ctx => {
// expensive computation
}, {
cache: {
enabled: true,
ttl: 1000 _ 60 _ 5 // 5 minutes
}
});

Internally, use setTimeout or a timestamp check to invalidate entries after TTL.

#### how it works

we dont do any internal cronjob magic when a request arrives it simply checks if the time it has the request gotten to the server minus the ttl before or after the setting, in the future we might make it so that if the ttl option is set it sets a setTimeout like this

cache<id/>.set()
setTimeout(() => , cache.<id/>ttl)

#### Tag-Based Invalidation

Associate multiple cache entries with a tag (e.g., "users" or "products") so they can be invalidated together.

app.get("/users", handler, {
cache: {
enabled: true,
tags: ["users"]
}
});

ctx.cache.invalidateTag("users");

Why?
You don’t need to track individual keys — perfect for bulk updates (e.g., DB migration, batch import).

#### Configurable Storage Backend

Allow storing cache in:

    Memory (default)

    Redis

    Filesystem

    Custom backend // needs to follow the ICache interface

    ```
    interface ICache {
        get(entryId: string): Optionable<Response>,
        set(entryId: string, value: Response)
        // no need for invalidate since it is implmented on the cache service level and it just calls set with null
    }
    ```

app.block(app => {
app.services.cache.setBackend(myCustomCacheAdapter); // implements get/set/invalidate interface
}) we need to use a block to keep the chaining

like that you decide where cache is being kept

#### Concurrency Locks (to Prevent Stampedes)

If multiple requests come in and the cache is cold, lock the handler execution to one request while others wait.

```ts

app.block( app =>
app.services.cache.config({
  lockDuringRefresh: true,
  maxWaitTime: 3000 // ms
});
)

```

#### Snapshot & Restore API

Let developers manually save/restore all cache state (useful in serverless or testing environments).

const snapshot = cache.snapshot();
cache.restore(snapshot);

this is one of the things that will be made the latest since it is not really the framework responsibility to do that

#### Dependency-Based Invalidation

Declare dependencies between routes so that when one is invalidated, others are too.

app.get("/dashboard", handler, {
cache: {
enabled: true,
dependsOn: ["/stats", "/profile"] // you can supply cache entries too, also you havee intellisense foe all registered routes and all registered caches
}
});

When /stats or /profile is invalidated, /dashboard's cache is too.

#### Conditional Caching (via Function)

Enable cache only when certain conditions are met (e.g., based on query, headers, or auth) basically you control whether it will cache this response or not based on this response and combined with the custom resolver it makes it pretty powerful

app.get("/report", handler, {
cache: {
enabled: ctx => ctx.user?.role === "admin",
ttl: 1000 \* 60
}
});

#### Conditional cache response

##### global and local

decides whether to show the cached entry or not when hitting an endpoint

if a global and local ones are defined the local one overwrites the global

syntax

```ts
app.get("/f", handler, { cache: {
  shouldReturn: cxt => boolean
} });
```

the ctx given is the app context, the request recieved

this is a type of a beforeHook

#### Note about intellisense

since ts as any other compiler (not gonna call it transpiler) it runs top to bottom so later chnages are not present in earlier blocks chnahes made to the cache later wont be in early blocks

for example you cache the get user route after the user post route, ts wont be able to find the cache in the delete route

#### Tips

use onStartup to preseed/prepopulate all caches but note to place it after all cache definitions so that you have intelisense for all

```ts

app.delete("/", ctx => {
    // ... perform some code here

    // ts does not know users exists although this code wont result in runtime error
    ctx.cache.users.get.invalidate() // like that we say that the cached version is no longer valid, behind the scenes we just set the entry to null, ts
})

app.get("/", ctx => {... /* code for the handler*/}, {cache: true})

```

#### Cache Debug Inspector

Built-in route (or dev tool integration) to view cached routes, TTL, hits/misses, and invalidation history. Featires an extrmely rich explorer from which you can interact with the cache collected metadata, set and insecpt values

app.get("/\_cache", ctx => {
return cache.inspect();
});

it can be enabled from the config

```ts
app.block(app => {
    app.services.cache.config(debugRoute: true)
    // or
    app.services.cache.enable("debugRoute") // intellsense
    // or
    app.services.cache.set("debug", true) // intelisense
})
```

#### Frozen Mode

Note this will be one of the latest things to do since this is not something the framework should do since you have plenty of freedom on when to set a new entry for a cache

for example insttead of frzoing a cache an admin username was returned instead check before seting it if the entry in the cache is an admin

#### Smart Cache Bypass

Skip cache intelligently if certain headers or query params are set:

in general you can put all kind of logic here as long as the handler returns a boolean

app.get("/data", handler, {
cache: {
enabled: true,
bypassIf: ctx => ctx.headers["x-force-fresh"] === "true"
}
});

app.get("/data", handler, {
cache: {
enabled: true,
bypassIf: ctx => ctx.req.ip.contains("200")
}
});

Prevent certain cache entries from being overwritten (until manually unfrozen).

ctx.cache.users.get.freeze(); // locks current value
ctx.cache.users.get.unfreeze(); // allows updates again

Useful for temporary lockdowns, testing, or audits.

#### Cache fallback

you can declare golbally in your config the provide value on error option which when a cached route thrown an error it returns the cached reponse.

#### Cache config Options

although some have alreay been covered here are all the cache

all => caches all routes by default unless you speciflally set {cache: false} in your handler

errorFallback => whenever an error is thrown in a cahced handler the cache returns the cache entry for the response. Note if a local errorFallback is defined the local one will be the one returning the reponse.

#### Cache router options

options you can pass to the cache route object

errorFallback: true -> when an error happens in this route return what is in the cache

how it works, it is placed at the end of the router after hooks stack so that its return is the response

#### Cache Resolver

##### global and local

function which determines what from the repose to cache

you get the context of the handler and the response of the handler

```ts
app.get("hh", vvv, { cache: {
  resolver: (ctx) => { req: ctx.req, ctx.res; }
} });
```

#### Manual Grouping of Cache Entries (namescpaes)

Allow developers to define cache groups manually and invalidate by group name.

cache.group("auth").add("/me", ctx => ctx.user.id);
cache.invalidateGroup("auth");

    For logically grouped invalidations, e.g., all user-profile-related entries.

or you can do it like this

app.get("", handler, {cache: {enabled: true, group: "me"}}) you will get intellisense on the groups and also if a group does not exist it will be created unless the explicitely define groups option is not set in the config and what this option does is if it is on you have to explicitely define all groups in the config before using them

##### Default groups

by default all registered routes are grouped in their won namespaces so that you have some groups without needing to do it

for example

```ts
app.get("/users/hi", handler, { cache: true });
```

will be added in the users group

if we have a subapp the cache is also inhering the groups of its parent

for example

```ts
rootApp;

const subApp = new Blazy({ prefix: "koko" });

const subApp2 = new Blazy().get("/user", handler, ({ cache: true }));

subApp.use(subApp2);

// hre the "/user" cached route will be in the koko and user group and in the user/koko group which is a permutTION OF BOTH z2
```

#### invalidating namespaces

you can also do cache.<namespace/>.invalidate() and all mmeber of this will be invalidated

#### planned cache miss

##### global and local

a function which is ran before q request whiich decides whether to serve the cached response or rerun the handler and populate the new response in the cache

#### metadata option

execpt the data the set method also allows to add additional data which can be used for metadata you can define a resolver for it on local and config level and the function recieves the context of the handler and the response. Also local ones add on top of config ones so they are stacking like a pipe. e,g, if you have defined a config level resolver you will get the metadata in a route level resolver

---

the cache is flexible you can do a lot of things with it

for example you can expose an endpoint so that users can manage a cache
