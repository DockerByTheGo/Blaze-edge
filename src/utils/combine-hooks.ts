import type { Hook } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { First, Last } from "@blazyts/better-standard-library";

export function combineHooks<THooks extends Hook<any, any>[]>(...hooks: THooks): Hook<
    string,
    (arg: First<THooks>["TGetArgType"]) => Last<THooks>["TGetReturnType"]
> {
    return {
        name: hooks.map(h => h.name).join(" -> "),
        handler: arg => hooks.reduce((acc, hook) => hook.handler(acc), arg)
    } as any;
}

export class HooksCombiner<THooks extends (Hook<any, any>)[], TName extends string> {

    protected constructor(private readonly hooks: THooks, private readonly name: TName) {

    }

    addHook<TNewHook extends Hook<any, any>>(v: TNewHook): HooksCombiner<[...THooks, TNewHook], TName> {
        this.hooks.push(v)
        return this as any
    }

    build(): Hook<TName, (arg: First<THooks>["TGetArgType"]) => Last<THooks>["TGetReturnType"]> {
        return {
            name: this.name,
            handler: arg => this.hooks.reduce((acc, hook) => hook.handler(acc), arg)
        } as any
    }

    static new<TName extends string>(name: TName) {
        return new HooksCombiner([], name)
    }
}