

# Express support
you can plug a blazy app into existing express app and it will just work, that way you can gradually move to blazy from an existing express app 

Just use the Express utility like so 



```ts
....imports

expressApp.use(ConvertToExpress(blazyApp))


```