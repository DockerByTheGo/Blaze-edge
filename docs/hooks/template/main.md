This hook allows you to define layouts for all HTML/JSX type responses.

## Basic Usage

For example, if you have two routes that return HTML and you want to wrap them in a layout:

```ts
app.use(template((ctx) => {
    return <Layout class={`${ctx.res.statusCode.isSuccess() ? "bg-green-500" : "bg-red-500"}`}>{ctx.body}</Layout>
}))
```

## Simple Template

If you prefer a simpler function without computations:

```ts
app.use(simpleTemplate(`
  <Layout>{body}</Layout>
`));
```

> **Note:** This might lead to XSS vulnerabilities if you don't sanitize your inputs.

## Example Routes

```ts
app.get("/", () => <div>hello</div>)
app.get("/about", () => <div>about</div>)
```

## Stacking Templates

Templates can be stacked:

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

### Output for "/"

```html
<div>
  <div>
    <Layout>
      <div>hello</div>
    </Layout>
  </div>
</div>
```
