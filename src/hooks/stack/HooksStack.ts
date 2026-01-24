import { Hooks, type DefaultHooks } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { HooksStack } from "./types";

export class HookStackManager<THooksStack extends HooksStack > {
    constructor(private readonly hooks: THooksStack){

    }

    public  get TGetHooks()  : THooksStack {
        return 
    }

    static empty(){
        return new HookStackManager({
            afterHandler: {
                afterResponse: Hooks.empty(),
                beforeResponse: Hooks.new()
            }, beforeHandler: {
                beforeAuth: Hooks.new(),
                onRequest: Hooks.new(),
                auth: Hooks.empty()
            }
        })
    }

    
}