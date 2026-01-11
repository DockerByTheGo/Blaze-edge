// remake to use the custom function constrrcut from better standsrdx lib 

import type { URecord } from "@blazyts/better-standard-library"

export function add<
        TExistingCtx extends URecord,
        TNewProperty extends URecord>(
                ctx: TExistingCtx,
                thingToAdd: TNewProperty
        ): TExistingCtx & TNewProperty {
        return {
                ...ctx,
                thingToAdd
        }
        // checks if it is there already
}

const userService = {hi: () => "hi" as const}

add({
        headers: {},
        token: ""
}, { user: userService })