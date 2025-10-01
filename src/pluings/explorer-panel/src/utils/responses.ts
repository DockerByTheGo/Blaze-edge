import { ResponseStatus } from "../app";

export const responsesStatuses = {
    success: new ResponseStatus(200), // OK
    created: new ResponseStatus(201), // Created
    accepted: new ResponseStatus(202), // Accepted
    noContent: new ResponseStatus(204), // No Content
    resetContent: new ResponseStatus(205), // Reset Content
    partialContent: new ResponseStatus(206), // Partial Content
    notFound: new ResponseStatus(404), // Not Found
    unauthorized: new ResponseStatus(401), // Unauthorized
    forbidden: new ResponseStatus(403), // Forbidden
    internalServerError: new ResponseStatus(500), // Internal Server Error
    badRequest: new ResponseStatus(400), // Bad Request
    tooManyRequests: new ResponseStatus(429), // Too Many Requests
    conflict: new ResponseStatus(409), // Conflict
    unsupportedMediaType: new ResponseStatus(415), // Unsupported Media Type
    unprocessableEntity: new ResponseStatus(422), // Unprocessable Entity
    methodNotAllowed: new ResponseStatus(405), // Method Not Allowed
    notAcceptable: new ResponseStatus(406), // Not Acceptable
    preconditionFailed: new ResponseStatus(412), // Precondition Failed
    payloadTooLarge: new ResponseStatus(413), // Payload Too Large
    uriTooLong: new ResponseStatus(414), // URI Too Long
    lengthRequired: new ResponseStatus(411), // Length Required
    gone: new ResponseStatus(410), // Gone
    imTeapot: new ResponseStatus(418), // I'm a teapot (for fun)
    locked: new ResponseStatus(423), // Locked
    failedDependency: new ResponseStatus(424), // Failed Dependency
    upgradeRequired: new ResponseStatus(426), // Upgrade Required
    tooEarly: new ResponseStatus(425), // Too Early
    unavailableForLegalReasons: new ResponseStatus(451), // Unavailable For Legal Reasons
    serverUnavailable: new ResponseStatus(503), // Service Unavailable
    gatewayTimeout: new ResponseStatus(504), // Gateway Timeout
    versionNotSupported: new ResponseStatus(505), // HTTP Version Not Supported
    networkAuthenticationRequired: new ResponseStatus(511), // Network Authentication Required
};

export const responses = {
    succesfullyCreatedEntity: () => {
        return {
            status: responsesStatuses.created,
            data: {},
        };
    },
    succesfullyCreatedEntityReturningTheEntity: <T>(data: T) => {
        return {
            status: responsesStatuses.created,
            data,
        };
    },
    found: <T>(data: T) => {
        return {
            status: responsesStatuses.success,
            data,
        };
    },
};
