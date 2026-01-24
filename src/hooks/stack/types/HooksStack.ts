import type { DefaultHooks } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks"

export type HooksStack = {
    beforeHandler: {
        onRequest: DefaultHooks,
        auth: DefaultHooks,
        beforeAuth: DefaultHooks,
    },
    afterHandler: {
        beforeResponse: DefaultHooks,
        afterResponse: DefaultHooks,
    }
}