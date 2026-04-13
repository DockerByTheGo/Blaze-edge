import type { BlazyDefault } from "@blazyts/blazy-edge"
import type { LogsRepo } from "../../modules/logs-repo";
import { EmptyLogsRepo } from "../../modules/logs-repo/EmptyLogsRepo";
import { setupServerHandlers } from "../../modules/setupServerServiceHandlers";
import { setupUi } from "../../modules/setupUi";
export const backendUiMiddleware = (
  app: BlazyDefault,
  logsRepo: LogsRepo = new EmptyLogsRepo(),
) => setupUi(setupServerHandlers(app), logsRepo) 
