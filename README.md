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
