import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import { File } from "node:buffer";
import fs from "node:fs";


export class FileRouteHandler implements IRouteHandler<
  { body: { file: File } },
  {}
> {
  constructor(private filePath: string) { }

  handleRequest(): { body: { file: File } } {
    return {
      body: {
        file: fs.createReadStream(this.filePath),
      },
    };
  }

  getClientRepresentation: {
    call(): File
  } = {call: () => 4} // TODO
}
