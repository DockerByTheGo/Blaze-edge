import { Hooks } from "@blazyts/backend-lib";
import { Blazy } from "./core";

export class BlazyConstructor {

    static createEmpty(): Blazy<{},{
  }> {
    return new Blazy({
      beforeHandler: Hooks.empty(),
      afterHandler: Hooks.empty(),
      onError: Hooks.empty(),
      onStartup: Hooks.empty(),
      onShutdown: Hooks.empty(),

    }, 
    {} as any,
     treeRouteFinder
    )
    // .addService(CACHE_SERVICE_NAME, new CacheService())
    // .addService("logger", new LoggerService(new ConsoleLogSaver()))
    // .beforeRequestHandler("log", ctx => )
  }

  static createProd() {
    return BlazyConstructor 
      .createEmpty()
      .beforeRequestHandler("attach", ctx => ({...ctx as {reqData: RequestData}, services: {}})) 
  }
}