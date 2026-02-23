import { Hook } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { First, Last } from "@blazyts/better-standard-library";

export function combineHooks<THooks extends Hook<any, any>[]>(...hooks: THooks): Hook<
    string,
    (arg: Parameters<First<THooks>["handler"]>[0]) => ReturnType<Last<THooks>["handler"]>
> {
    return new Hook(
        hooks.map(h => h.name).join(" -> "),
        (arg) => {
            const result = hooks.reduce((acc, hook) => {
                // If acc is a Promise, chain the next handler
                if (acc instanceof Promise) {
                    return acc.then(resolved => hook.handler(resolved));
                }
                // Otherwise, just call the handler
                return hook.handler(acc);
            }, arg);

            return result;
        }
    ) as any;
}

export class HooksCombiner<THooks extends (Hook<any, any>)[], TName extends string> {

    protected constructor(private readonly hooks: THooks, private readonly name: TName) {

    }

    addHook<TNewHook extends Hook<any, any>>(v: TNewHook): HooksCombiner<[...THooks, TNewHook], TName> {
        this.hooks.push(v)
        return this as any
    }

    build(): Hook<TName, (arg: THooks extends [] ? any : Parameters<First<THooks>["handler"]>[0]) => THooks extends [] ? any : ReturnType<Last<THooks>["handler"]>> {
        return new Hook(
            this.name,
            arg => this.hooks.length === 0 ? arg : this.hooks.reduce((acc, hook) => hook.handler(acc), arg)
        ) as any
    }

    static new<TName extends string>(name: TName) {
        return new HooksCombiner([], name)
    }
}