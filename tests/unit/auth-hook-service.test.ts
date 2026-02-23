import { describe, it, expect } from "bun:test";
import { AuthService } from "../../src/pluings/auth";
import { Blazy } from "../../src/core";

describe("AuthService", () => {
  it("creates, verifies and revokes sessions", () => {
    const service = new AuthService<{ id: string; role: string }>();

    service.createSession("token-1", { id: "user-1", role: "admin" });

    const verified = service.verifyToken("token-1");
    expect(verified?.user.id).toBe("user-1");
    expect(verified?.user.role).toBe("admin");

    expect(service.fromAuthorizationHeader("Bearer token-1")?.token).toBe("token-1");
    expect(service.fromAuthorizationHeader("Basic token-1")).toBeNull();

    const revoked = service.revoke("token-1");
    expect(revoked).toBe(true);
    expect(service.verifyToken("token-1")).toBeNull();
  });
});

describe("Blazy auth hook", () => {
  it("runs beforeAuth first and then authenticates via auth service", () => {
    const authService = new AuthService<{ id: string }>();
    authService.createSession("dev-token", { id: "u-1" });

    const app = Blazy
      .create()
      .addService("auth", authService)
      .beforeAuth("copy-token-to-bearer", (req: any) => ({
        ...req,
        headers: {
          ...req?.headers,
          authorization: req?.headers?.authorization ?? `Bearer ${String(req?.headers?.["x-token"] ?? "")}`,
        },
      }))
      .auth();

    const authedReq = app.routerHooks.beforeHandler.execute({
      url: "http://localhost/private",
      verb: "POST",
      headers: {
        "x-token": "dev-token",
      },
    } as any) as any;

    expect(authedReq.auth.id).toBe("u-1");
    expect(authedReq.authSession.token).toBe("dev-token");

    expect(() => {
      app.routerHooks.beforeHandler.execute({
        url: "http://localhost/private",
        verb: "POST",
        headers: {},
      } as any);
    }).toThrow("Unauthorized");
  });

  it("supports custom service names and attach field", () => {
    const internalService = new AuthService<{ id: string; tenant: string }>();
    internalService.createSession("tenant-token", { id: "u-2", tenant: "acme" });

    const app = Blazy
      .create()
      .addService("internalAuth", internalService)
      .auth({
        serviceName: "internalAuth",
        attachAs: "principal",
        allow: req => String(req?.url ?? "").includes("/public"),
      });

    const publicReq = app.routerHooks.beforeHandler.execute({
      url: "http://localhost/public",
      headers: {},
    } as any) as any;
    expect(publicReq.principal).toBeUndefined();

    const privateReq = app.routerHooks.beforeHandler.execute({
      url: "http://localhost/private",
      headers: {
        authorization: "Bearer tenant-token",
      },
    } as any) as any;

    expect(privateReq.principal.id).toBe("u-2");
    expect(privateReq.principal.tenant).toBe("acme");
  });
});
