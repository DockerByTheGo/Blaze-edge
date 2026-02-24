import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promises as fs } from "node:fs";

import { FileSavingService } from "../../../src/services";

describe("FileUploadService (FileSavingService)", () => {
  it("persists a payload once and refuses to overwrite when the file already exists", async () => {
    const storageRoot = await fs.mkdtemp(join(tmpdir(), "file-upload-service-test-"));
    const service = new FileSavingService(storageRoot);

    try {
      const firstResult = await service.saveIfNotExists("nested/example.txt", "first content");
      expect(firstResult.created).toBe(true);

      const savedPath = join(storageRoot, "nested/example.txt");
      const diskContent = await fs.readFile(savedPath, "utf-8");
      expect(diskContent).toBe("first content");

      const secondResult = await service.saveIfNotExists("nested/example.txt", "second content");
      expect(secondResult.created).toBe(false);
      expect(secondResult.path).toBe(firstResult.path);
      const diskContentAfterSecondCall = await fs.readFile(savedPath, "utf-8");
      expect(diskContentAfterSecondCall).toBe("first content");

      const exists = await service.exists("nested/example.txt");
      expect(exists).toBe(true);
    } finally {
      await fs.rm(storageRoot, { recursive: true, force: true });
    }
  });

  it("throws when a relative path escapes the configured root", async () => {
    const storageRoot = await fs.mkdtemp(join(tmpdir(), "file-upload-service-error-"));
    const service = new FileSavingService(storageRoot);

    try {
      let thrown: Error | null = null;
      try {
        await service.saveIfNotExists("../escape.txt", "payload");
      } catch (error) {
        thrown = error as Error;
      }
      expect(thrown).toBeInstanceOf(Error);
    } finally {
      await fs.rm(storageRoot, { recursive: true, force: true });
    }
  });
});
