

import { HtmlPageResponse, type BlazyDefault } from "@blazyts/blazy-edge";
import { renderToString } from "react-dom/server";
import type { LogsRepo } from "../logs-repo";
import { LogsView} from "../ui/pages/logs";
import { ServicesUi } from "../ui/pages/services";

export function setupUi(app: BlazyDefault, logsRepo: LogsRepo){
    return app
    .get({
      path: "/logs",
      handler: ctx => {
        return HtmlPageResponse(renderToString(<LogsView app={ctx} logsRepo={logsRepo} />))
      },
      args: undefined 
    })
    .get({
      "path": "/services",
      handler: ctx => {
        console.log("dd",ctx.services)
        return HtmlPageResponse( renderToString(<ServicesUi services={ctx.services} />))},
      args: undefined
    })
}
