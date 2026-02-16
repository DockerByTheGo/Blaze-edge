import type { ifAny } from "@blazyts/better-standard-library";

import type { ClientHooks } from "../types/ClientHooks";
import type { Config } from "../types/Config";

import { Client,type ClientObject } from "../Client";
import { Hooks, type RouteTree } from "@blazyts/backend-lib";

export const CleintBuilderConstructors = {

  empty() {
    return new ClientBuilder(
      {
        afterReceive: Hooks.empty(),
        beforeSend: Hooks.empty(),
        onErrored: Hooks.empty(),
      },
      {
        retries: 3,
      },
      {},
    );
  },

  fromRouteTree(router: RouteTree) {
    return new ClientBuilder(
      {
        afterReceive: Hooks.empty(),
        beforeSend: Hooks.empty(),
        onErrored: Hooks.empty(),
      },
      {
        retries: 3,
      },
      router,
    );
  },

};

export class ClientBuilder<
  TRouter extends RouteTree,
  THooks extends ClientHooks,
> {
  constructor(
    public hooks: THooks,
    private config: Config,
    protected router: TRouter,
  ) { }

  hook<
    THookType extends keyof ClientHooks,
    THookName extends string,
    TReturn,
  >(args: {
    name: THookName;
    type: THookType;
    handler: (v: THooks[THookType]["TGetLastHookReturnType"]) => TReturn;
  },
  ): ClientBuilder<
    TRouter,
    THooks & { [K in THookType]: { handler: (v: THooks[THookType]["TGetLastHookReturnType"]) => TReturn } }
  > {
    this.hooks[args.name] = args;
    return this;
  }

  // TODO: make it so that if we add a certain header here it removes it from the requored parameters
  beforeSend<
    TReturn,
    TName extends string,
  >(
    func: (arg: ifAny<THooks["beforeSend"]["TGetLastHookReturnType"], {}>) => TReturn,
    name: TName,
  ): ClientBuilder<
    TRouter,
    THooks & {
      beforeSend: Hooks<[
        ...THooks["beforeSend"]["v"],
        Hook<TName, (func: ifAny<THooks["beforeSend"]["TGetLastHookReturnType"], {}>) => TReturn>,
      ]>;
    }
  > {
    this.hooks.beforeSend.push(func);

    return this;
  }

  static empty() {
    return new ClientBuilder(
      {
        afterReceive: Hooks.empty(),
        beforeSend: Hooks.empty(),
        onErrored: Hooks.empty(),
      },
      {
        retries: 3,
      },
      {},
    );
  }

  createClient(): ClientObject<TRouter> {
    return new Client(
      this.hooks,
      this.config,
      this.router,
    );
  }
}

