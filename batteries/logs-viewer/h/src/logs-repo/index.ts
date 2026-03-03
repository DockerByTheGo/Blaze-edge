import {Optionable} from "@blazyts/better-standard-library";
import {Log} from "@blazyts/blazy-edge"

export interface LogsRepo {
    getRequestLog(id: string): Promise<Optionable<Log>>;
    getAllLogs(): Promise<Log[]>;
}