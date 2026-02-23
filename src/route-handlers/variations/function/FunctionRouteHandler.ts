import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import { BasicValidator, type IFunc, type URecord } from "@blazyts/better-standard-library";

export class FunctionRouteHandler<
    TFunc extends IFunc<string, URecord, URecord>

> implements IRouteHandler<
    {body: TFunc["TGetArgs"]},
    {body: TFunc["TGetReturnType"]}
> {
    public readonly metadata: { subRoute: string };

    constructor(public readonly func: TFunc, subRoute?: string){
        this.metadata = {
            subRoute: subRoute ?? `/rpc/${this.func.name}`,
        };

    }   
    
    handleRequest: (arg: { body: TFunc["TGetArgs"]; }) => { body: TFunc["TGetReturnType"]; }  = (arg) => {
        new BasicValidator(this.func.argsSchema).validate(arg.body)

        return this.func.execute(arg.body)
    }

    getClientRepresentation = (metadata: { subRoute: string }) => ({
        method: "post",
        path: metadata.subRoute
    })
}
