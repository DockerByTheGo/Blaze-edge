# Name 
@blazy/http-stack
# Hooks 
## Life cycle 
see the fastify and elysia comparison for inspiration https://elysiajs.com/migrate/from-fastify.html

## temlpate

this is a hook which allows you to define layouts for all html/jsx type responses

For exmaple  you have two routes which return html and you want to wrap them in a layout 

```ts
app.use(template((ctx) => { // you have access to the whole context if you need to do some logic before rendering, for example


    return <Layout class=`${ctx.res.statusCode.isSuccess() ? "bg-green-500" : "bg-red-500"}`>{ctx.body}</Layout>
}))
// if you wish a simpler function where you do not make any computation you can also use 


app.use(simpleTemplate(`

  <Layout>{body}</Layout>

`)) // this is our custom template engine called simple template where your response will be placed wherver body is typed

// Note: this might lead to xss vulnerabilities if you do not sanitize your inputs 

app.get("/", () => <div>hello</div>)

app.get("/about", () => <div>about</div>)


```


They can also be stacked

```ts
app.use(template(ctx => {

  return <div>{ctx.body}</div>
}))

app.use(template(ctx => {

  return <div>{ctx.body}</div>  
}))


app.use(simpleTemplate(`

  <Layout>{body}</Layout>

`))

app.get("/", () => <div>hello</div>)

app.get("/about", () => <div>about</div>)
```

hitting / will return 

```html

<div>
  <div>
    <Layout>
      <div>hello</div>
    </Layout>
  </div>
</div>

```
    


## block

Block is a piece of code which allows you to interact with the context of an app without needing a route. Since context is specific to routes a block is essentially a route habdler however it cabt be invoked

## Expose service

this allows you to pass an object and its publix methods become endpoints. By default every method is gonna be post and no validation is enforced sincee there is  no schema to get. If the object implements the ICrudified interface it will be translated to the appropirate http verbs however there is still no validation. Also you can pass the "guess" flag as a scond arg and it will try to guess the metthods from the object (for example if a method has get in the name it will be  a get if it has create it will be post, etc...). To enforce validation you can use our ObjectBuilder builder which allows you to define the type for the arg of a func using a vakidator 


ObjectBuiler.new({docs: ""}).addPrivateProperty("name-of-property", property).addPrivateMethod(internalCtx /*contains name of property, all properties and all previously defined methods*/ => ..., {docs: "idk"}).addPublicMethod("name", z.object({}), ({internalCtx, arg}) => {...}, {docs: "idk"})


this will allows us to safeguard and include validation and even docs for the endppoints

## AddService
(service: Service)

Allows you to add a microservice to your app which you can later refernce and recieve a single source of thrurh

Also when a service is added you get acess to ita hooks which are onQueried(method, dataPassedToMwthid, ReturnOfMethod)

OnAdded(the service obj)

You can subscribe to them either from the glbal swrvices object

Services.global.onAdded(name, object: intellisense using overloads)


Or subscribing to specific one 

servies.[name].onQueried(method)
services.[name].onInitialsed

You can also hook into a specific method

Services.[namr].onCreate(data // again intellisensed) // inyellisense
### Why is it helpful
Imagine the following scenario

You have a general backend and a job runner which has a single endpoint for processing a video. In the traditional way you have to manually generate a client refernce it etc
.. like that you just create the service using a `Service template` like the `HttpServer` where you define the structure and then you can include it using addService and you get intellisense on the service.

### Support



## AddMicroservice 

This is kinda like [[#AddService]] however for each microservice it actually creates a new process whixh is isolated from the others and like that you can manage all your microservices from single project. Also you will havw again access using intellisense to the microservice

Git worktree


# management panel 
like encore one

## Endpoint tester

It comes with a mamagement panel for the websocket and http endpoints where it shows various info. It has logs tabs where it has kept all the logs from all the performed requests. Also another feature is request invocation route for each request it logs all thr invokation of each service after it so thay for each request tou make you see what was passed to each service entity etc...

## Backend explorer

It visualizes you code structure on a backend level e.g. you can see all your services which endpoints use whixh services. For example you can go on a certain service and directly invoke its public methids from the gui. Inspectimg logs -> also in your app config you can enabke the logs for services where each time a service method is called it logs the params and the result and also which request invoked it (this works if we also have the distributed logging option turned on). Also you can see the docs for a certain service sinve our Swrvice builder supoorts docs and also if it is a class if it jas jsdoc we scan for it amd display it

it also comes with a powerful filter option 

for example you have the follwing structure

/
- users
  - get /:id
  - post /
  - friends
    - post /new
    - get  /
- admin
  - deleteApp

you can opt to view only the users controller and like that you wont see the admin one nor any services that are not called inside any of the routes of user. For example if admin uses the admin service under the no filter it will show up but with the `controller:[{name: "users"}]` it wont 

Query syntax

you can search for controllers like that 
`controllers:{name: <controler-route>, showSubroutes: false}[]` the second option would remove the friends routes from the exporer it will just show that it exposes a subrouter

you can search for services like that 
`services:{uses: service-name[]}` will show all routes which call the certain service

## Active connections 
displays all websocket connections if any are present 



## History 

you can see the [[#History]]
and you can query it in a sql like manner 

```example-query

WHERE REQ.IS_HTTP AND REQ.HEADERS.AUTHORIZATION_ATTEMPT > 10 

```
#### Code explorer
and we also have a backend graph which you can enable by going into 
`middlewares/gui/main.ts` and do
```ts
ManagementPanel(["code-explorer"]) // that way you enable it, if users think it is redundant we will make it on by def and you needing to explicitely turn it off 
```

which makes the a uml like graph showing s=which shows the realtionsips between controllers services repos etc... in a graph like manner

---- 
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
                 │ Book  │◄────────────┐  │
				 └───────┘             │  │

---
									   │  │
           ┌────────────────────┐     │  │
           │   UserController   │     │  │
           └────────┬───────────┘     │  │
                    │                 │  │
                    ▼                 │  │
           ┌────────────────────┐     │  │
           │    UserService     │◄────┘  │
           └────────┬───────────┘        │
                    │                    │
                    ▼                    │
           ┌────────────────────┐        │
           │  UserRepository    │        │
           └────────┬───────────┘        │
                    │                    │
                    ▼                    │
                 ┌───────┐               │
                 │ User  │◄────────────┐ │
                 └───────┘             │ │
                                       │ │
           ┌────────────────────┐     │ │
           │  OrderController   │     │ │
           └────────┬───────────┘     │ │
                    │                 │ │
                    ▼                 ▼ ▼
           ┌────────────────────┐────▶────┐
           │   OrderService     │────────▶│
           └────────┬───────────┘         │
                    │                     │
                    ▼                     │
           ┌────────────────────┐         │
           │ OrderRepository    │         │
           └────────┬───────────┘         │
                    │                     │
                    ▼                     │
                 ┌───────┐                │
                 │ Order │◄───────────────┘
                 └───────┘

---


TODO: here use your own graph software and documentation



## Extending 

The management panel xan be extended by passing other options to the router, it follows the jsx standard so its as easy as

app.extras.panel.addRoutes({
route => jsx
})

---

Also for the websockets presentation tell something in the lines of :

Well as you cam see tere is a lot of things happening at the compiler time some of which were extremely hard to implement why is that? -> will in my experience compile time checks are better than runtime and the more logic of my app I can shift to the compiler instead for me to check the bette. Also ask to be in one polufinal with Valery as a juri or of he is not a jury find him in the people which are looking at projects and show to him this




When you do a presentation about a product say something in the lines of pravih tova activity no imah problem saladin nesgto si I si kazan zashto sa ne naoravq treto neshto koeto da reshava toq problem

---

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
`onFirstEntry(ctx => void)`  runs whenever an entry has been populated for the. ctx is the data it has recieved for the entry plus the Handler object for which the cache was  changed
`onChanged(ctx => void)` runs whenever the an entry has been changed, ctx is the same as onFirstEntry, if users says it is needed in the future it will provide also which in order change is it, e,g, first chnage, second change and so on, iit is hookd directly to the set method so it unrs whenever set is called no matter where
`onInvalidated(ctx => void) ` runs whenver a cache is invalidated and the ctx is the entry which was invalidated and the `Handler Object`

### Service level caching

Since we are a `multi-protocol-framework` and sometimes you want to expose the same service from mutliple protocols you might want to cache services too. You can do this by using the  `cachify` utility on an existing or already added service. It supports all the options as the route cacher 

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
    key: ctx => ctx.params.id  // unique cache key per user ID
  }
});

by default the key for a cache is a compressed version of the whole request

e.g. 

```ts
cache: {
  key: ctx => compress(JSON.stringify(ctx.req))
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
    ttl: 1000 * 60 * 5  // 5 minutes
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
    dependsOn: ["/stats", "/profile"] // you can supply cache entries too,  also you havee intellisense foe all registered routes and all registered caches
  }
});

When /stats or /profile is invalidated, /dashboard's cache is too.

#### Conditional Caching (via Function)

Enable cache only when certain conditions are met (e.g., based on query, headers, or auth) basically you control whether it will cache this response or not based on this response and combined with the custom resolver it makes it pretty powerful

app.get("/report", handler, {
  cache: {
    enabled: ctx => ctx.user?.role === "admin",
    ttl: 1000 * 60
  }
});

#### Conditional cache response
##### global and local
decides whether to show the cached entry or not when hitting an endpoint

if a global and local ones are defined the local one overwrites the global 


syntax

```ts
app.get("/f", handler, {cache: {
  shouldReturn: cxt => boolean
}})
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


app.get("/_cache", ctx => {
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

ctx.cache.users.get.freeze();   // locks current value
ctx.cache.users.get.unfreeze(); // allows updates again

Useful for temporary lockdowns, testing, or audits.

#### Cache fallback

you can declare golbally in your config the provide value on error option which when a cached route thrown an error it returns the cached reponse.

#### Cache config Options

although some have alreay been covered here are all the cache 

all => caches all routes by default unless you speciflally set {cache: false} in your handler

errorFallback => whenever an error is thrown in  a cahced handler the cache returns the cache entry for the response. Note if a local errorFallback is defined the local one will be the one returning the reponse. 

#### Cache router options 
options you can pass to the cache route object

errorFallback: true -> when an error happens in this route return what is in the cache 

how it works, it is placed at the end of the router after hooks stack so that its return is the response 

#### Cache Resolver
##### global and local
function which determines what from the repose to cache 

you get the context of the handler and the response of the handler
```ts
app.get("hh",vvv, {cache: {
  resolver: ctx => {req: ctx.req, ctx.res}
}})
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
app.get("/users/hi", handler , {cache: true})
```

will be added in the users group


if we have a subapp the cache is also inhering the groups of its parent

for example 

```ts
rootApp

const subApp = new Blazy({prefix: "koko"})

const subApp2 = new Blazy().get("/user", handler, ({cache: true})) 

subApp.use(subApp2)


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


# Types

## Handler object 
{
    url: string, 
    config : {
        cache: Cache,
        validators: {
            body: ...
            params: ...
        }
    }
}
###


Steal things from encore cloud






# Built in services
## replacing services

Note you can easily replaxe a certain service by using the app.services.<service-name/>.replace(y) it just needs to follow the interface for the desired service

## Secrets storage 

We have a secrets storage service  which comes with a lot or preconfigured ways to make secrets

### Terms
#### Resolver
a function which feches the value of the env 

##### Defining one

It Must follow the ResolveResult type 
which indicates wheter the resolve failed or not 

### Api

#### Adding and configuring a secret 

```ts
app.services.secretsManager
.addSecret("<name>",/* Strategy to load */ secretsManager.strategies.ENV("<name>"))
```
this is the base syntax to use we will go over more below 

other supported options are
```ts
import {secretsManager} from "@blazyts/framework-builktins-secrets-manager"

const str = secretsManager.strategies

...
.addSecret("name", str.Request(/* fetch info*/)) // performs http req , this is useful when you use a remote vault for envs and you can implement a mixed strategy where you hide the key for the vault in env and keep the rest in the vault, just make sure its https to not let sniffers get you  :)
```
##### Options

###### When to load

####### On startup
some env are not needed to load at startup, if you need to add the `getOnStartup` and if its not found it will throw an error however you can overwrite that behaviour too. Otherwise it will be loaded when it is first being accessed
```ts
addSecret("name", strategy, {
  options: SecretOptions.new().getOn("Startup")
})
```

####### OnDemand

although you probably wont need to set it you can set it explicitely like this  SecretOptions.new().getOn("Demand")

!Note: if you need to have some more complex logic for loading we encourage you to create `Job` in which you init the env. For example like this 
```ts
app.servcies.JobsManager.createJob("initDb", ({app}) => {app.services.secrets.<secret-name/>.load()} ) // correct syntax is omitted for clairity
```

###### Refresh 

Sometimes we need to refresh secrets and although you can achieve this with a simple job (not that we do not do it in a different way) it is reccpmended to use the `refresh` 

####### OnDemand

runs the resolve function each time load() is called

####### Custom 

a function which runs in the background as a job continiously and has the sercet and app objects as context


#### Accessing

##### load()

#### Setting



you can also set it manually without the resolver the only constraint you need to follow is that it must match the return type of the resolver 

example usage

```ts
jobsManager.<job-name/>.set() // does not run resolver
```

#### OnResolveFailure



#### Resolve

runs the resolver which sets the env to the result of the func  

### Hooks

as it is a service wach of the method is hooked and also accesible via api

### Bundles

allows you to set common settings for multiple secretsa at once 

```ts
Bundle.mew().addOption({...common_options_here}).addSecret() // will inheeeit everything from addOption and if an option appears here ti it will overwrite the est from the addOption
```


## File Storage

### Built in 
S3
Local iin memory and local on disx(uses multer)

### Customm
For custom ones theyne3d to implement IFileStorage

## Mailer

Has all of the features of the redwood mailer

Also exposes hooks for all of its methods

## Signals

Our typesafe pub sub solution

This is a typesafe utility whuch allows you to degine signals. You can get all available signals using app.services.signalsManager.addListener()
Typesafety on bith the name and the data object. It is better to use our signals than your own since they are typesafe with minimal cpde and no explicit code s.g. no `as ...` assignements whuch might break code without the compiler knowing and also expose hooks. It also comes woth a typesafe emitter

### Hooks

OnSignalRegistered

OnSignalPublished

All hooks support the pipe system as always

### Management panel

## Auth

### Overview
A service that comes with a lot of things you might need for auth

### Built in Auth strategies
The framework comes with a ton of auth strategies which you can configure using the services.auth

#### Session 

#### Jwt 


##### passwordless login

https://www.instagram.com/reel/DLx_Pw_xHNO/?igsh=MWdyZzNibXBrcXpvbA==

https://www.instagram.com/reel/DMIhROQR_9g/?igsh=MWxjemtvc2NkZHJoZw==

https://www.instagram.com/reel/DLYV9dFhKRf/?igsh=MXZ6dG5hM25tbm5jaA==

https://www.instagram.com/reel/DLnI_uvJTGZ/?igsh=MXAybGc0Y2NhZXFpMw==

### Config

#### Strategy

Accepts rhe strategy used for authentication methids

You can use the bultins using Services.Builtinss.Auth....

Or you can pass your own whichvmust implement thr IAuthStart interface

# Built in support for jsx in routes



Look at pino js for how to build a good logger and encore one too

like emcore distributed tracing too 

like encore flow chart

components view like encore service view but on steroids and supporting more than just services2





We also have sentry support


# Distributed tracing and open telemitry

## customizing logs
You can use the @AddMetadata decorator tovadd metadata to a class or to a method if you are using manual classes. Or if you sre using our builders most of them have options to add metadata to methods or to the entity. For examplenif adding a service usisng our service builder 

```ts
app
.AddService(
ServiceBuilder({metadata:{your_custom_fields_which_will_be_showed: {...}, name: ....}})
)
```

Or you could use our decorator to take an existing component and decorate 

```ts
app.use(decorateService({
component : {your metadata here},
Methods: {
methodOne : { // has intellisense
AdditionalData
}
}

}))
```

## Per service
You see how muxh the request took to process from being processed by a microservice in yiur app and you can see the entering and exit data

## Per backend component
You can see what data came in what it returned and how muxh time it took between individual components like from controller to service from swrvice to repository etc...

## Per non lib function
It logs the params the output and time of each function you have written. It is important to note that it does not record and benchmark the internal functions the app uses . It logs only your code not ours. If you want to see ours too you have to pass the logAll method

# Microservices mode

We also some with a microservices mode which allows you to not only logically but physically seperate services.


## Defining microservices

You need to install the @blazyts/micro package and use the addMicroservice() which accpets a name of the microservice and an App argument which suports all express combined apps  and our own apps (either http-stack or core) 

# Services

Service is an object passed to the service object manager and like that it becomes part of your app and also you can hook into it and we create the hook handlers autoamtically you just need ti provide the object 

it also has another goodies like exposing an api for the service methods so that you can call the service meethods remotely if you want. This can be disabled by adding the no-api option. 

```ts
app.services.addService({
service: ...,
options: {
disable: ["api"]
}
})
```

or disable certain methods only (execpt the provate ones which are disabled by default and cant be exposed unless changed to public)

```ts
app.services.addService({
service: ...,
options: {
disable: {"api": {
  // methods which you want to disable. it is typesafe since it takes your whole object and using ts magic extracts the public things
}}
}
})
```

note that exposed services are also added in the clinet accessible under the `services` property like so

```ts
client.services.<service-name/>.method() // typesafe
```
## Code invoker, you can start your app woth code invoker where it exposes a ui in which you can individually invoke a class method and see the res inside a ui. 

### Types


#### More specific hooks

##### Macros

##### Blocks

### App level hooks

### Handler level hooks
