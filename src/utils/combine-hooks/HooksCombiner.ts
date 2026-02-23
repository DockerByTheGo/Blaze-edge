import { Hook } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { First, Last } from "@blazyts/better-standard-library";

/**
 * A builder class for combining hooks with a fluent API.
 * Allows adding hooks one at a time and building the combined hook with a custom name.
 */
export class HooksCombiner<THooks extends (Hook<any, any>)[], TName extends string> {

    protected constructor(private readonly hooks: THooks, private readonly name: TName) {

    }

    /**
     * Adds a new hook to the combiner chain.
     * 
     * @param v - The hook to add
     * @returns A new HooksCombiner with the hook added
     */
    addHook<TNewHook extends Hook<any, any>>(v: TNewHook): HooksCombiner<[...THooks, TNewHook], TName> {
        this.hooks.push(v)
        return this as any
    }

    /**
     * Builds the final combined hook with all added hooks chained together.
     * 
     * @returns A single hook that chains all added hooks
     */
    build(): Hook<TName, (arg: THooks extends [] ? any : Parameters<First<THooks>["handler"]>[0]) => THooks extends [] ? any : ReturnType<Last<THooks>["handler"]>> {
        return new Hook(
            this.name,
            (arg) => {
                if (this.hooks.length === 0) return arg;
                
                const result = this.hooks.reduce((acc, hook) => {
                    // If acc is a Promise, chain the next handler
                    if (acc instanceof Promise) {
                        return acc.then(resolved => hook.handler(resolved));
                    }
                    // Otherwise, just call the handler
                    return hook.handler(acc);
                }, arg);

                return result;
            }
        ) as any
    }

    /**
     * Creates a new HooksCombiner instance with the given name.
     * 
     * @param name - The name for the combined hook
     * @returns A new HooksCombiner instance
     */
    static new<TName extends string>(name: TName) {
        return new HooksCombiner([], name)
    }
}
