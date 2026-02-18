import { cleint } from "./client";
import { app } from "./server";

app.listen(3000)
const k = await (await cleint.routes.jiji.koko["/"]({ koko: "" })).json()


