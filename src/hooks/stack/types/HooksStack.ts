export type HooksStack = {
    beforeHandler: {
        onRequest: [],
        auth: [],
        beforeAuth: [],
    },
    afterHandler: {
        beforeResponse: {},
        afterResponse: {},
    }
}