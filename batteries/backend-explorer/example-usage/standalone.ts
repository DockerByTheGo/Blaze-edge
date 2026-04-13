import { BackendExplorerServer } from "../src";
import { BlazyConstructor } from "@blazyts/blazy-edge";
import { MockLogsRepo } from "../tests/mocks/MockLogsRepo";

const cartService = {
    config: {},
    getAll: () => ["cart 1", "cart 2", "cart 3"]
};

const app = BlazyConstructor
    .createProd()
    .addService("cartService", cartService);

const explorerServer = new BackendExplorerServer(
    "http://localhost:3000",
    app,
    new MockLogsRepo(),
).listen(0);

console.log(`Backend explorer running at ${explorerServer.url}`);
