
### Service wrapping

When you pass your service to addService you not only recieve your original service option object but also you can subsribe to its events.

For example we have a user service

```ts
Class User{
add(){}
}

app
.addService(new User())
.block(app => app.ctx.services.user.onAdd(v => v))
```

In this case it might not be much but if a service is lets say a microservice and you want to react to its events wothout directly writing anything its pretty cool

Allows you to add a microservice to your app which you can later reference and receive a single source of thrurh

Also when a service is added you get acess to ita hooks which are onQueried(method, dataPassedToMwthid, ReturnOfMethod)

OnAdded(the service obj)

You can subscribe to them either from the glbal swrvices object

Services.global.onAdded(name, object: intellisense using overloads)

Or subscribing to specific one

services.[name].onQueried(method)
services.[name].onInitialsed

You can also hook into a specific method

Services.[name].onCreate(data // again intellisensed) // inyellisense

### Why is it helpful

Imagine the following scenario

You have a general backend and a job runner which has a single endpoint for processing a video. In the traditional way you have to manually generate a client refernce it etc
.. like that you just create the service using a `Service template` like the `HttpServer` where you define the structure and then you can include it using addService and you get intellisense on the service.

When you pass your service to addService you not only receive your original service option object but also you can subscribe to its events.

For example we have a user service

```ts
Class User{
add(){}
}

app
.addService(new User)
.use(c => c.services.user.onAdd(v => v))
```

In this case it might not be much but if a service is lets say a microservice and you want to react to its events wothout directly writing anything its pretty cool
