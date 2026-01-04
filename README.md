# Name

@blazy/http-stack

# Hooks

## temlpate

this is a hook which allows you to define layouts for all html/jsx type responses

For exmaple you have two routes which return html and you want to wrap them in a layout

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
#
# Built in support for jsx in routes

Look at pino js for how to build a good logger and encore one too

like emcore distributed tracing too

like encore flow chart

components view like encore service view but on steroids and supporting more than just services2

We also have sentry support