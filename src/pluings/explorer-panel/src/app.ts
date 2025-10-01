import type { Router } from "express";
import type {
    ZodObject,
    ZodSchema,
} from "zod";

import { Optionable } from "errors-as-types/lib/rust-like-pattern/option";
import express from "express";
import { console } from "node:inspector";
import swaggerui from "swagger-ui-express";
import {
    z,
} from "zod";

import type { ApiPath } from "./types/apiApth";
import type { HttpVerb } from "./types/networking/httpVVerbs";
import type { Port } from "./types/networking/port";
import type { RouterMetadata } from "./types/openapi/main";

import { TypeSafeClassBase } from "../../packages/better-standard-library/data_structures/contextsafetype";
import {
    MyOpenApiDefinitions,
    ParameterEnums,
} from "./types/openapi/main";
import { parseZodUnion } from "./utils/zod-related/main";
import { zodSchemaIntoOpenapiResponseContentDefinition } from "./utils/zod-related/parseZodSchema";

const OpenAPIClientAxios = require("openapi-client-axios").default;

export class ResponseStatus extends TypeSafeClassBase<number> {}

type RequestDefinitionObject<RequestBody, RequestParams, ResponseBody, Query> =
  {
      body: ZodSchema<RequestBody>;
      params: ZodSchema<RequestParams>;
      query: ZodSchema<Query>;
      // responses: {statusCode: StatusCode, schema: ZodSchema<ResponseBody>}[];
      responses: ZodSchema<ResponseBody>;
  };

export type RequestResponse<ResponseData> = {
    status: ResponseStatus;
    data: ResponseData;
};

export type RequestHandler<
    ContextType,
    RequestBody,
    RequestParams,
    ResponseBody,
    Query,
> = (
    req: express.Request<RequestParams, ResponseBody, RequestBody, Query>,
    res: express.Response<ResponseBody>,
    next: express.NextFunction,
    ctx: ContextType
) => Promise<
  RequestResponse<ResponseBody> | RequestResponse<{ error: string }>
>;
function panic(msg: string = ""): void {
    throw new Error(msg);
}

type RouteMetadata = {
    description: Optionable<string>;
};

// why are we using zod

export class WebRouter<ContextType> {
    protected context: ContextType;
    protected expressRouter: Router;
    protected port: Optionable<Port> = new Optionable<Port>(null);
    protected routerMetadata: RouterMetadata;
    private readonly usedRoutes: Record<HttpVerb, string[]> = {
        get: [],
        post: [],
        delete: [],
        put: [],
        patch: [],
        options: [],
    };

    constructor(
        context: ContextType,
        routerMetadata: RouterMetadata,
        port?: Port,
    ) {
        new Optionable(port).ifCanBeUnpacked(() => {
            this.port = new Optionable<Port>(port);
        });
        this.expressRouter = express.Router();
        this.context = context;
        this.routerMetadata = routerMetadata;
        this.expressRouter.get("/spec", (req, res) => {
            res.json(this.routerMetadata.toOpenApiSpec());
        });
    }

    private async customResponseToExpressResponse<ResponseData>(
        res: express.Response,
        result: RequestResponse<ResponseData> | RequestResponse<{ error: string }>,
    ): Promise<void> {
        const resolvedResult = result;
        res.status(resolvedResult.status.getValue()).json(resolvedResult.data);
    }

    private wrapHandler<RequestBody, RequestParams, ResponseBody, Query>(
        validator: RequestDefinitionObject<
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        handler: RequestHandler<
            ContextType,
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
    ) {
        return async (
            req: express.Request<RequestParams, ResponseBody, RequestBody>,
            res: express.Response<ResponseBody | { error: string }>,
            next: express.NextFunction,
        ) => {
            try {
                const bodyValidation = validator.body.safeParse(req.body);
                const paramsValidation = validator.params.safeParse(req.params);
                const queryParamsValidation = validator.query.safeParse(req.query);
                if (
                    !bodyValidation.success
                    || !paramsValidation.success
                    || !queryParamsValidation!
                ) {
                    res.status(406).json({
                        error:
              `${
                  bodyValidation.error?.toString()
              }${paramsValidation.error?.toString().trim()
              }${queryParamsValidation.error?.toString().trim()}`,
                    });
                    return;
                }
                // req.query = queryParamsValidation.data
                // Call the handler with validated data
                const result = await handler(req, res, next, this.context);
                (() => {
                    // todo: validate it against the validator.responses
                    let isSuccesful = false;
                    parseZodUnion(validator.responses).map((response) => {
                        if (response.safeParse(result).success) {
                            isSuccesful = true;
                        }
                    });

                    if (!isSuccesful) {
                        return this.customResponseToExpressResponse(res, {
                            status: new ResponseStatus(403),
                            data: {
                                error: "response wihch was made is not from the expected",
                            },
                        });
                    }
                })();
                await this.customResponseToExpressResponse(res, result);
            }
            catch (error) {
                next(error);
            }
        };
    }

    get<RequestParams, ResponseBody, Query>(
        route: ApiPath,
        validator: RequestDefinitionObject<{}, RequestParams, ResponseBody, Query>,
        handler: RequestHandler<
            ContextType,
            {},
            RequestParams,
            ResponseBody,
            Query
        >,
        openapiEndpointMetaData?: RouteMetadata,
    ): this {
        this.routerMetadata.addEndpoint({
            verb: "get",
            parameters: [
                zodSchemaIntoOpenapiResponseContentDefinition(
                    validator.params as ZodObject<any>,
                ),
            ],
            description: openapiEndpointMetaData?.description ?? new Optionable(""),
            responses: [],
            route,
        });

        this.usedRoutes.get.forEach((existingRoute) => {
            if (route.value === existingRoute) {
                panic(`route ${route} for HTTP VERB get is already defined`); // TODO: add checks like these for the rest of the http verbs
            }
        });

        this.usedRoutes.get.push(route.value);

        this.expressRouter.get(
            route.value,
            this.wrapHandler(
                {
                    body: z.object({}),
                    params: validator.params,
                    responses: validator.responses,
                    query: validator.query,
                },
                handler,
            ),
        );

        return this;
    }

    registerRoute<
        Method extends HttpVerb,
        RequestParams,
        ResponseBody,
        Query,
        RequestBody = Method extends "get" ? {} : any,
    >(
        method: Method,
        route: ApiPath,
        validator: RequestDefinitionObject<
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        handler: RequestHandler<
            ContextType,
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        openapiEndpointMetaData?: RouteMetadata,
    ): this {
    // Check if the route is already registered
        this.usedRoutes[method].forEach((existingRoute) => {
            if (route.value === existingRoute) {
                panic(
                    `Route ${
                        route.value
                    } for HTTP VERB ${method.toUpperCase()} is already defined`,
                );
            }
        });

        this.usedRoutes[method].push(route.value);

        // Define OpenAPI parameters
        const parameters = (() => {
            const pathParamsEntity = zodSchemaIntoOpenapiResponseContentDefinition(
                validator.params,
            );
            const queryParamsEntity = zodSchemaIntoOpenapiResponseContentDefinition(
                validator.query,
            );

            const paramsList = Object.entries(pathParamsEntity.properties).map(
                ([key, value]) => ({
                    name: key,
                    in: "path" as ParameterEnums.In,
                    schema: value,
                    required: value.required,
                    style: ParameterEnums.Style.simple,
                }),
            );

            Object.entries(queryParamsEntity.properties).forEach(([key, value]) => {
                paramsList.push({
                    name: key,
                    in: "query",
                    schema: value,
                    required: value.required,
                    style: ParameterEnums.Style.simple,
                });
            });

            return paramsList;
        })();

        // Register OpenAPI metadata
        this.routerMetadata.addEndpoint({
            verb: method,
            parameters,
            description: new Optionable(openapiEndpointMetaData?.description ?? ""),
            responses:
        method === "post"
            ? parseZodUnion(validator.responses).map(response => ({
                    content: {
                        [MyOpenApiDefinitions.MIMEType.applicationJson]: {
                            schema: zodSchemaIntoOpenapiResponseContentDefinition(
                                response as ZodObject<any>,
                            ),
                        },
                    },
                }))
            : [],
            route,
        });

        // Register the route in Express
        this.expressRouter[method](
            route.value,
            this.wrapHandler(validator, handler),
        );

        return this;
    }

    post<RequestBody, RequestParams, ResponseBody, Query>(
        route: ApiPath,
        validator: RequestDefinitionObject<
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        handler: RequestHandler<
            ContextType,
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
    ): this {
        this.usedRoutes.post.forEach((existingRoute) => {
            if (route.value === existingRoute) {
                panic(`route ${route} for HTTP VERB post is already defined`);
            }
        });

        // a bit more clarifications on params, so params is not an array since params have anmes and so they resemble more of an object structre than an array so every entry inside the object is a param

        this.usedRoutes.post.push(route.value);

        this.routerMetadata.addEndpoint({
            verb: "post",
            parameters: (() => {
                const pathParamsEntity = zodSchemaIntoOpenapiResponseContentDefinition(
                    validator.params,
                );
                console.log(
                    "zod schema into params",
                    "zod",
                    validator.params,
                    pathParamsEntity,
                );

                const parameters = Object.entries(pathParamsEntity.properties).map(
                    ([key, value]) => {
                        return {
                            name: key,
                            in: "path" as ParameterEnums.In,
                            schema: value,
                            required: value.required,
                            style: ParameterEnums.Style.simple,
                        };
                    },
                );

                const paramsInQuery = zodSchemaIntoOpenapiResponseContentDefinition(
                    validator.query,
                );

                Object.keys(paramsInQuery.properties).forEach((key) => {
                    parameters.push({
                        name: key,
                        in: "query",
                        schema: paramsInQuery.properties[key],
                        required: paramsInQuery.properties[key].required,
                        style: ParameterEnums.Style.simple,
                    });
                });

                return parameters;
            })(),
            description: new Optionable(""),
            responses: parseZodUnion(validator.responses).map((response) => {
                const parsedObj = zodSchemaIntoOpenapiResponseContentDefinition(
                    response as ZodObject<any>,
                );

                console.log(76767676767676);
                console.log(parsedObj);
                console.log(76767676767676);
                return {
                    [parsedObj.properties.statusCode]: {
                        content: {
                            [MyOpenApiDefinitions.MIMEType.applicationJson]: {
                                schema: parsedObj,
                            },
                        },
                    },
                };
            }),
            route,
        });
        this.expressRouter.post(route.value, this.wrapHandler(validator, handler));

        return this;
    }

    delete<RequestBody, RequestParams, ResponseBody, Query>(
        route: string,
        validator: RequestDefinitionObject<
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        handler: RequestHandler<
            ContextType,
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
    ): void {
        this.expressRouter.delete(route, this.wrapHandler(validator, handler));
    }

    put<RequestBody, RequestParams, ResponseBody, Query>(
        route: string,
        validator: RequestDefinitionObject<
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
        handler: RequestHandler<
            ContextType,
            RequestBody,
            RequestParams,
            ResponseBody,
            Query
        >,
    ): void {
        this.expressRouter.put(route, this.wrapHandler(validator, handler));
    }

    withMiddlewares(...middlewares: express.RequestHandler[]): this {
        middlewares.forEach((middleware) => {
            this.expressRouter.use(middleware);
        });

        return this;
    }

    addSubRouter(path: ApiPath, router: express.Router): void {
        this.expressRouter.use(path.value, router);
    }

    getExpressRouter(): Router {
        return this.expressRouter;
    }

    createChildRouter<NewRouterContext>(
        additionalContext: NewRouterContext,
        subPath: ApiPath,
    ) {
        const newRouter = new WebRouter(
            { ...this.context, ...additionalContext },
            this.routerMetadata.createSubRouterMetadataDefinition(subPath),
        );
        this.expressRouter.use(subPath.value, newRouter.getExpressRouter());
        return newRouter;
    }

    async generateClient() {
        const api = new OpenAPIClientAxios({
            definition: this.routerMetadata.toOpenApiSpec,
        });
        const client = await api.init(); // Initializes the client
        return client;
    }

    start(port: Port): void {
        const app = express();
        app.use(express.json()); // Ensure JSON parsing middleware is used
        app.use(this.expressRouter);
        let alreadyDefined = false;

        alreadyDefined = true;

        this.expressRouter.use(
            "/api-docs",
            swaggerui.serve,
            swaggerui.setup(null, {
                swaggerOptions: {
                    url:
            `http://localhost:${
                this.port.unpack_with_default(port).value
            }/spec`,
                },
            }),
        );
        this.port.ifCanBeUnpacked((v) => {
            console.log("port is already set above");
            app.listen(v.value, () => {
                console.log(`Server is running on port ${v.value}`);
            });
        });

        if (alreadyDefined) {
            app.listen(port.value, () => {
                console.log(`Server is running on port ${port.value}`);
            });
        }
    }
}
