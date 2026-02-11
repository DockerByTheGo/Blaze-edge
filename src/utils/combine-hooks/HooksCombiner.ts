import type { Hook } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
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
    build(): Hook<TName, (arg: First<THooks>["TGetArgType"]) => Last<THooks>["TGetReturnType"]> {
        return {
            name: this.name,
            handler: arg => this.hooks.reduce((acc, hook) => hook.handler(acc), arg)
        } as any
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
