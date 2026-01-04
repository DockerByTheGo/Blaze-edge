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
