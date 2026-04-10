import { describe, expect, it } from "vitest";
import { BlazyConstructor } from "src/app/constructors";
import { treeRouteFinder } from "src/route/finders/tree";
import { Path } from "@blazyts/backend-lib/src/core/server/router/utils/path/Path";

describe("HTTP handlers", () => {
  it("registers and resolves a GET handler on a hardcoded path", () => {
    const app = BlazyConstructor.createEmpty().get({
      path: "/health",
      handler: () => ({ body: { ok: true, type: "hardcoded-get" } }),
      args: undefined,
    });

    const protocols = treeRouteFinder(app.routes, new Path("/health")).unpack().raw as any;

    expect(protocols.GET).toBeDefined();
    expect(protocols.POST).toBeUndefined();
    expect(protocols.GET.handleRequest({})).toEqual({
      body: { ok: true, type: "hardcoded-get" },
    });
  });

  it("registers and resolves a GET handler on a dynamic path", () => {
    const app = BlazyConstructor.createEmpty().get({
      path: "/users/:id",
      handler: ({ id, params }) => ({ body: { id, paramsId: params.id, type: "dynamic-get" } }),
      args: undefined,
    });

    const protocols = treeRouteFinder(app.routes, new Path("/users/42")).unpack().raw as any;

    expect(protocols.GET).toBeDefined();
    expect(protocols.GET.handleRequest({})).toEqual({
      body: { id: "42", paramsId: "42", type: "dynamic-get" },
    });
  });

  it("registers and resolves a POST handler on a hardcoded path", () => {
    const app = BlazyConstructor.createEmpty().post({
      path: "/posts/create",
      handeler: ({ title }: { title: string }) => ({
        body: { created: true, title, type: "hardcoded-post" },
      }),
    });

    const protocols = treeRouteFinder(app.routes, new Path("/posts/create")).unpack().raw as any;

    expect(protocols.POST).toBeDefined();
    expect(protocols.GET).toBeUndefined();
    expect(protocols.POST.handleRequest({ title: "hello" })).toEqual({
      body: { created: true, title: "hello", type: "hardcoded-post" },
    });
  });

  it("registers and resolves a POST handler on a dynamic path", () => {
    const app = BlazyConstructor.createEmpty().post({
      path: "/users/:userId/posts/:postId",
      handeler: ({ userId, postId, params, body }: { userId: string; postId: string; params: { userId: string; postId: string }; body: { content: string } }) => ({
        body: {
          userId,
          postId,
          paramsUserId: params.userId,
          paramsPostId: params.postId,
          content: body.content,
          type: "dynamic-post",
        },
      }),
    });

    const protocols = treeRouteFinder(app.routes, new Path("/users/7/posts/11")).unpack().raw as any;

    expect(protocols.POST).toBeDefined();
    expect(protocols.POST.handleRequest({
      body: { content: "hello world" },
    })).toEqual({
      body: {
        userId: "7",
        postId: "11",
        paramsUserId: "7",
        paramsPostId: "11",
        content: "hello world",
        type: "dynamic-post",
      },
    });
  });
});
