import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promises as fs } from "node:fs";

import z from "zod/v4";

import { Blazy } from "../../src/core";
import { FileSavingService } from "../../src/services";

describe("e2e FileUploadService route", () => {
  it("executes a handler that saves the incoming payload through FileSavingService", async () => {
    const storageRoot = await fs.mkdtemp(join(tmpdir(), "blazy-upload-e2e-"));
    const fileSavingService = new FileSavingService(storageRoot);
    let app = Blazy.create().addService("fileSaver", fileSavingService)
    .post({
      path: "/uploads/save",
      args: z.object({
        name: z.string(),
        content: z.string(),
      }),
      handeler: async (ctx) => {
        const service = app.getService<FileSavingService>("fileSaver");
        if (!service) {
          throw new Error("fileSaver service is not registered");
        }

        const targetRelativePath = join("uploads", ctx.body.name);
        const result = await service.saveIfNotExists(targetRelativePath, ctx.body.content);

        return {
          statusCode: 201,
          path: result.path,
          created: result.created,
        };
      },
    });

    const port = 3025;
    const server: any = app.listen(port);

    try {
      const client = app.createClient().createClient()(`http://localhost:${port}`);
      const payload = { name: "route-demo.txt", content: "sync-with-service" };
      const response = await client.routes.uploads.save["/"].POST(payload);
      const payloadResult = await response.json();

      expect(payloadResult.statusCode).toBe(201);
      expect(payloadResult.created).toBe(true);

      const storedPath = join(storageRoot, "uploads", payload.name);
      const diskContent = await fs.readFile(storedPath, "utf-8");
      expect(diskContent).toBe(payload.content);
    } finally {
      try {
        server.stop?.();
      } catch {
        //
      }
      await fs.rm(storageRoot, { recursive: true, force: true });
    }
  });
});
