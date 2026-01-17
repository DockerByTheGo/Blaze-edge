// remake to use the custom function constrrcut from better standsrdx lib 

import type { URecord } from "@blazyts/better-standard-library"

function isPlainObject(v: unknown): v is Record<string, unknown> {
        return v !== null && typeof v === "object" && !Array.isArray(v)
}

function deepMerge<A extends Record<string, unknown>, B extends Record<string, unknown>>(a: A, b: B): A & B {
        const out: Record<string, unknown> = { ...a }
        for (const key of Object.keys(b)) {
                const bv = (b as Record<string, unknown>)[key]
                const av = (a as Record<string, unknown>)[key]

                if (isPlainObject(av) && isPlainObject(bv)) {
                        out[key] = deepMerge(av as Record<string, unknown>, bv as Record<string, unknown>)
                } else {
                        out[key] = bv
                }
        }
        return out as A & B
}

export function add<
        TExistingCtx extends URecord,
        TNewProperty extends URecord>(
                ctx: TExistingCtx,
                thingToAdd: TNewProperty
        ): TExistingCtx & TNewProperty {
        return deepMerge(ctx as unknown as Record<string, unknown>, thingToAdd as unknown as Record<string, unknown>) as TExistingCtx & TNewProperty
}

const userService = { hi: () => "hi" as const }

add({
        headers: {},
        token: ""
}, { user: userService })