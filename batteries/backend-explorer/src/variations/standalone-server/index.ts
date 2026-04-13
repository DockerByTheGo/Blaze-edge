import type { BlazyDefault } from "@blazyts/blazy-edge";
import type { LogsRepo } from "../../modules/logs-repo";
import { EmptyLogsRepo } from "../../modules/logs-repo/EmptyLogsRepo";
import { setupServerHandlers } from "../../modules/setupServerServiceHandlers";
import { setupUi } from "../../modules/setupUi";

export class BackendExplorerServer {
    constructor(
        public readonly serverUrl: string,
        private readonly serverApp: BlazyDefault,
        private readonly logsRepo: LogsRepo = new EmptyLogsRepo(),
    ) {}

    listen(port: number = 3000) {
        return setupUi(
            setupServerHandlers(this.serverApp),
            this.logsRepo,
        ).listen(port);
    }
}
