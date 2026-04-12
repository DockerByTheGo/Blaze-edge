import { HtmlPageResponse, HtmlResponse, type Blazy, type BlazyDefault } from "@blazyts/blazy-edge"
import type { LogsRepo } from "../logs-repo";
import { MockLogsRepo } from "../logs-repo/MockLogsRepo";
import { setupServerHandlers } from "./setupServerServiceHandlers";
import { setupUi } from "./setupUi";
export const backendUi = (
  app: BlazyDefault,
  logsRepo: LogsRepo = new MockLogsRepo(),
) => setupUi(setupServerHandlers(app), logsRepo) 
