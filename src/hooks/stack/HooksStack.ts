import type { HooksStack } from "./types";

export class HookStackManager<THooksStack extends HooksStack > {
    constructor(private hooks: {onRequest: unknown}){

    }

    public  get TGetHooks()  : THooksStack {
        return
    }
}