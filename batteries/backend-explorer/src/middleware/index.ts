import type { Blazy } from "@blazyts/blazy-edge"
import { LogsView } from "../pages/logs"

export const backendUi(app: Blazy) {
    if(route === "/logs") {
        return LogsView()
    }
}