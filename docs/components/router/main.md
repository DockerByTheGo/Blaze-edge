# Router

## Http 

### Ways to define endpoints

#### Post

#### Get

#### Delete

#### All

#### fromObject

```ts
fromObject(v: Record<string,unknown> | IObject) {...}
```


accepts a generic object ir better standard object custom object from object builder where it can try gussing the routes


this allows you to pass an object and its public methods become endpoints. By default every method is gonna be post and no validation is enforced since there is  no schema to get. If the object implements the ICrudified interface it will be translated to the appropirate http verbs however there is still no validation. Also you can pass the "guess" flag as a scond arg and it will try to guess the metthods from the object (for example if a method has get in the name it will be  a get if it has create it will be post, etc...). To enforce validation you can use our ObjectBuilder builder which allows you to define the type for the arg of a func using a vakidator 


ObjectBuiler.new({docs: ""}).addPrivateProperty("name-of-property", property).addPrivateMethod(internalCtx /*contains name of property, all properties and all previously defined methods*/ => ..., {docs: "idk"}).addPublicMethod("name", z.object({}), ({internalCtx, arg}) => {...}, {docs: "idk"})


this will allows us to safeguard and include validation and even docs for the endppoints

#### customRedolver for path params


You can also use the CustomResolver to define a path param logic


```ts
app
.get(new Path()
	.addParam("id", c => or(
		c.isNjmber().below(100),
		c.isString().contains("somwthing")
		) 
	)
)

```


Note this takes the least priority from all routes


### Priority

This is how the router decides where a request should go if it is matched by multiple requests

It follows this order
1. Static ones
2. Dynamic witth custom resolvers
3. Dynamic

#### overwriting

If you want to override this order for some reason yoi can pass the priority flag and set a value of 1 2 3 and it will be trested as if it is ij the selcted group. And if you want to be the first ine in a certain group also pass the befirst flag. When passed it will take priority within its group, for example if multiple requests within group one match a request the one with beFirst will executed. 

Note that these options should be avoided since they slow the router dramatically

If no priority is given in a group it gets the first one that matches and they are in order of adding

For example
```ts
app.get('/:id')
app.get('/:otber')

// A call to /1 will,be handled by the /:id route handler
```



## Applying hooks to websocket routes


Since websockets work a bit differently than http routes there are two way with which you can approach them 


1. Apply the same middleware to ws routes

This works by enabling the `config.websocket.useSameMiddlewareAsHttp` option

```ts
app.config.websocket.useSameMiddlewareAsHttp.set(true)

app.config.websocket.useSameMiddlewareAsHttp.enable()

app.config.websocket.setBundle({useSameMiddlewareAsHttp: true})

app.config.websocket.enable(["useSameMiddlewareAsHttp"])
```
that way the general middlewares will be ran against the websocket routes too but it comes with the drawback of the need for the websocket requests to follow the convenction of the http 

for example if we have enabled the `config.http.useSameMiddlewareAsHttp` option then the websocket routes will also be protected by the auth middleware

```ts
app.use(guard({
  headers: {
    token: z.string()
  }
}))
```

and they would need to have a headers in each message like so 
```ts

client.ws.connect({headers: {token: "some-token"}})
client.ws.<some-route/>.send({
  headers: {
    token: "some-token"
  }
})

```
which is not ideal both in terms of code quality and performance

2. Applying specific middleware to ws routes

using the ws option 

```ts
app.use(ws(msg => { // the default is onMessage handler
  // this will only run against ws messages
}))
```

### how it works 

Well inside the hook we just check if it is a websocket request we are dealing with by checking the ctx object 
```ts
const isWebSocket = request.headers.get('upgrade')?.toLowerCase() === 'websocket';
```

### Options 

BeforeConnection

#### Scope 
only per app e.g. only global

```ts
app.use(ws())
```


## Lazy event handlers

You can define lazy event handlers using defineLazyEventHandler or lazyEventHandler utilities. This allow you to define some one-time logic that will be executed only once when the first request matching the route is received.

A lazy event handler must return an event handler:
```ts

import { defineLazyEventHandler, defineEventHandler } from "h3";

app.use(
  defineLazyEventHandler(() => {
    console.log("This will be executed only once");
    // This will be executed only once
    return defineEventHandler((event) => {
      // This will be executed on every request
      return "Response";
    });
  }),
);
```

This is useful to define some one-time logic such as configuration, class initialization, heavy computation, etc.


Using an empty return or return undefined make a 404 Not Found status response. Also using return null will make a 204 No Content status response.



## Making responses

### respondWith(e: Response)
by default the response is the return value of the handler. However you can use the ctx object to make a response and send it without returning from the function 

Note: if you return something from the handler with ctx.respondWith it wont be sent and so it wont go through afterResponse hooks however it will be passed to afterHandler Hook 
```ts
() => {ctx.respondWith(new Response("Hello World")

  // the rest of the code will still exexcute

  return ... // will be fed into afterHandler
}
```

Note: when using ctx.respondWith even if you return a response it wont be send and also the moment you call respondWith the afterResponse hook will fire not waiting for the handler to finish  and running with whatever the respondWith was passed

### predefined behaviour for retuns 

return undefined -> 204 No Content
return null -> 404 Not Found
return string | object | array | number | boolean -> 200 OK and whatever you have returned

for example 

```ts
app.get("/idk", handler => {
  return "idk" will return 200 OK with the body "idk"
})
```

Note: this is not true for hooks. To return a Response from a hook you need to explicitely return a Response no matter the state of the setting

### implicit response
if you do not want any kind of return to be the response you can disable implicit response

#### setting it 

app.config.ImplicitReponse.set(boolean) 

app.config.ImplicitReponse.disable()

app.config.ImplicitReponse.enable()




and this will require implicitely defining responses like 

```ts
app.get("/idk", handler => {
  return Response.successfull("idk")
  // or 
  return Response.new("idk", 200)
}, {
	responses: {
		status: 200,
		body: "idk"
	}
})
```


### afterHandler (({ctx: Context, result: any}) => any)

this is a hook which operates with whatever the handler returns  no matter if it is a respnse or not and also recieves the context which the handler had access to. Atleast thats the first hook in the afterHandler stack after it you decide on the context. If no response has been retirned the after Respons can return a response and will trigger the afterRsponse hooks, also after it returns a Response (you can use respondWith here too) its return is still fed into the next hook.




---



Note: if ImplicitResponse is enabled and we do not return any response from our handler that is of type response the afterHandler hook (not to be confused with the afterResponse hook) will follow and if in any of them there is  a respose it will be sent. This can be helpful in times where you have simple endpoints that just do something and the return is the same for all of them e,g, 204 No Content and so you can do something liek this. If ImplicitResponse is disabled and you do not return anything from a function since js returns undefined from void function it will return 204 No Content. If a response is returned but afterHandle



```ts
app.afterHandler(ctx => Response.new("ok", 200))
.post("/doJobOne", () => {...})
.post("/doJobTwo", () => {...})
.post("/doJobThree", () => {...})

```


Here is a pseudo code which ilustrates this 

```ts 
beforeHandler().map(result => {
  result.isResponse
   ?  sendResponse(res)
   :  handler(res),map(result =>
      ctx.confg.NoImplicitResponse.get() 
      ? result.isResponse 
        ? sendResponse(result) /* internally sets the ctx.response object to the sent response */ -> afterResponse and afterHandler Hooks fire  -> afterHandlerHooks.forEach(hook => hook(result).ifNoResponseIsSent(result => result.isResponse ? sendResponse(result) : result))
        : afterHandlerHooks.forEach(hook => hook(result).ifNoResponseIsSent(result => result.isResponse ? sendResponse(result) : result))
      : result
   ) 
  

})
```



### how it works

after a handler finishes its request ctx req object is checked for the didSendResponse flag and if it is trye we simply do not return the returned from the handler as a response


## Streaming 
Built in support for exposing streaming endpoints with tons of utilites. Like this but better, cleaner and with more features https://hono.dev/docs/helpers/streaming





##### special convention 
if you dont wanna use a validator object for specifying types you can also a special convention from our framework in which using prefixes you specify path parameters

```ts
app.get(
"/ji/:koko",
{"koko" /*btw you get intellisense here since koko is a path paramter*/: z.number()} , ctx => {
	ctx.req.params.isFloat() // autoamitacally tuerned into a number obj 
})
```

turns into 

```ts
app.get("/ji/:$koko",ctx => {
	ctx.req.params.isFloat() // autoamitacally tuerned into a number obj 
} )
```

to indicate that koko is  a number we prefix with "$" and like that you will recieve koko as a number object directly 

###### others
date -> (
boolean -> ^





## Request object

Wraps around the basic.request object but adds utilitilies like making optional query params follow the option pattern

### Api 

#### getRaw
returns the raw http object following the convention establised by express js

## Additional things

### Catch all route vs global router hook

Since there were a lot of questions about when to use a catch all route 

which is the following

app.all("\*")

vs a global hook handler

---

well the purpose of hooks is to accomodate existing routes, more like performing side effects or transforming data so that the route handler can do its job e.g. you should not put business logic inside a global hook and you should put it in a catch all handler 

There is is also another thing which is a catch all router is final e,g. other routes wont execute however with a global hook they will. 





# direct support for entites

## With name


## Without name

It gets the name of the variable at compile time


Syntax

```ts
.use(UserEntity)

```
