

import { HtmlPageResponse, type BlazyDefault } from "@blazyts/blazy-edge";
import { renderToString } from "react-dom/server";
import type { LogsRepo } from "./logs-repo";
import { LogsView} from "../ui/pages/logs";
import { ServicesUi } from "../ui/pages/services";

export function setupUi(app: BlazyDefault, logsRepo: LogsRepo){
    return app
    .get({
      path: "/logs",
      handler: async ctx => {
        const initialLogs = await logsRepo.getAllLogs();
        const websocketMessagesByConnectionId: Record<string, Awaited<ReturnType<NonNullable<LogsRepo["getWebSocketMessages"]>>>> = {};

        if (logsRepo.getWebSocketMessages) {
          await Promise.all(
            initialLogs
              .map(log => log.connectionId)
              .filter((connectionId): connectionId is string => Boolean(connectionId))
              .map(async (connectionId) => {
                websocketMessagesByConnectionId[connectionId] = await logsRepo.getWebSocketMessages!(connectionId);
              }),
          );
        }

        return HtmlPageResponse(renderToString(
          <LogsView
            app={ctx}
            initialLogs={initialLogs}
            logsRepo={logsRepo}
            websocketMessagesByConnectionId={websocketMessagesByConnectionId}
          />,
        ))
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
