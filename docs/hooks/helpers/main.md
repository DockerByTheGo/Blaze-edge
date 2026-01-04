# Overview

since most of the time we are doing the same work using hooks here are some helpers to make it easier

## tap

allows you to work with the ctx of the previous hook without modifying it by creating a copy of the context

```ts
app.hook(tap((ctx) => {
  ctx.jojo += 2; // this will not modify the ctx of the next hook
}));
```

## add

allows you to add something to the ctx of the next hook

```ts
app.hook(add({ jojo: 2 })); // add something to the ctx of the next hook

// a shorthand of

app.hook((ctx) => {
  return { ...ctx, jojo: 2 };
});

// if we want to nest we can do it like so

app.hook(add({ body: { jojo: "" } })); // it will merge this new body with the existing body, if the body is not an object it will throw an error, if the body already has this field it will override it unless we set the replace iexsting field flag to false
```


With this helper you do

```ts
app.hook(add( () => {
  // your code to check it 
  return {isAdmin: true}}), "add admin status")
```

or if you just need to attach something without much computatuon ther is another overload

```ts
app.hook(add({isAdmin: true}, "add admin status")
```
``

## validate

allows you to validate the ctx of the previous hook

```ts
app.hook(validate(z.object({ jojo: z.number() })));
```

you can chnage what happens when it is invalid by using the second arg

```ts
app.hook(validate(z.object({ jojo: z.number() }), (ctx, error) => {

}));
```
