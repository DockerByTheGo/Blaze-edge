import { dirname, resolve, join, sep } from "node:path";
import { promises as fs, type WriteFileOptions } from "node:fs";
import type { IFileSaver, SaveIfNotExistsOptions, SaveIfNotExistsResult } from "../IFileSaver";

const DEFAULT_STORAGE_ROOT = join(process.cwd(), "storage");

/**
 * Local file system storage implementation
 * Stores files on the local disk with security checks
 */
export class LocalFileSaver implements IFileSaver {
  private readonly rootPath: string;
  private readonly rootWithSep: string;

  constructor(rootDirectory: string = DEFAULT_STORAGE_ROOT) {
    this.rootPath = resolve(rootDirectory);
    this.rootWithSep = this.rootPath.endsWith(sep)
      ? this.rootPath
      : `${this.rootPath}${sep}`;
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
    await fs.writeFile(targetPath, payload, options as WriteFileOptions);
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
