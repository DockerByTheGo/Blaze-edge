import { z } from "zod";

import type { Url } from "./networking/url.js";
import type { MyOpenApiDefinitions } from "./openapi/main.js";

namespace Client {

  export type Metadata = {
    url: Url;
  };

  const endpointObject = z.object();

  type Endpoints<T extends string, Y> = Record<T, Y>;

}

class Client<T extends string> {
  private metadata: Client.Metadata;

  readonly routes;
  constructor(metadata: Client.Metadata, endpoints: (MyOpenApiDefinitions.EndpointMetadata)[]) {

  }
}
