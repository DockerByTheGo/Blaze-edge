import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import { BasicValidator, type IFunc, type URecord } from "@blazyts/better-standard-library";

export class FunctionRouteHandler<
    TFunc extends IFunc<string, URecord, URecord>

> implements IRouteHandler<
    {body: TFunc["TGetArgs"]},
    {body: TFunc["TGetReturnType"]}
> {
    constructor(public readonly func: TFunc){

    }   
    
    handleRequest: (arg: { body: TFunc["TGetArgs"]; }) => { body: TFunc["TGetReturnType"]; }  = (arg) => {
        new BasicValidator(this.func.argsSchema).validate(arg.body)

        return this.func.execute(arg)
    }

    getClientRepresentation = () => ({
        method: "post",
        path: "/rpc/" + this.func.name
    })
}