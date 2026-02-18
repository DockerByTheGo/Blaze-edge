import { app } from "./server";

export const cleint = app.createClient().createClient()("http://localhost:3000")
console.log("difrinfirnfirnfrn", JSON.parse(JSON.stringify(cleint.routes)))