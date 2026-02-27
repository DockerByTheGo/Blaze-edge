import type { Multer, StorageEngine } from "multer";
import { promises as fs } from "node:fs";
import { dirname, resolve, join, sep } from "node:path";
import type { IFileSaver, SaveIfNotExistsOptions, SaveIfNotExistsResult } from "../IFileSaver";

/**
 * Multer-based storage implementation
 * Integrates with Express/Multer for file uploads with custom storage engine
 */
export class MulterFileSaver implements IFileSaver {
  private readonly rootPath: string;
  private readonly rootWithSep: string;

  constructor(rootDirectory: string = join(process.cwd(), "uploads")) {
    this.rootPath = resolve(rootDirectory);
    this.rootWithSep = this.rootPath.endsWith(sep)
      ? this.rootPath
      : `${this.rootPath}${sep}`;
  }

  /**
   * Creates a Multer storage engine for use with Express
   */
  createStorageEngine(): StorageEngine {
    return {
      destination: async (req, file, cb) => {
        try {
          const dest = this.rootPath;
          await this.ensureDirectory(join(dest, "dummy"));
          cb(null, dest);
        } catch (error) {
          cb(error as any);
        }
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        cb(null, filename);
      },
    };
  }

  async saveIfNotExists(
    relativePath: string,
    payload: Buffer | string,
    options?: SaveIfNotExistsOptions,
  ): Promise<SaveIfNotExistsResult> {
    const targetPath = this.resolveTargetPath(relativePath);
    if (await this.pathExists(targetPath)) {
      return { path: targetPath, created: false };
    }

    await this.ensureDirectory(targetPath);
    const buffer = typeof payload === "string" ? Buffer.from(payload) : payload;
    await fs.writeFile(targetPath, buffer);
    return { path: targetPath, created: true };
  }

  async exists(relativePath: string): Promise<boolean> {
    const targetPath = this.resolveTargetPath(relativePath);
    return this.pathExists(targetPath);
  }

  private resolveTargetPath(relativePath: string): string {
    const cleanedRelative = relativePath.replace(/^\/+/, "").trim();
    const candidate = resolve(this.rootPath, cleanedRelative);
    if (candidate !== this.rootPath && !candidate.startsWith(this.rootWithSep)) {
      throw new Error("Access outside of the storage root directory is not allowed");
    }
    return candidate;
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    await fs.mkdir(dirname(filePath), { recursive: true });
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
