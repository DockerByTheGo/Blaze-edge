import type { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { IFileSaver, SaveIfNotExistsOptions, SaveIfNotExistsResult } from "../IFileSaver";

/**
 * AWS S3 storage implementation
 * Stores files in an S3 bucket with optional prefix
 */
export class S3FileSaver implements IFileSaver {
  private s3Client: S3Client;
  private bucketName: string;
  private prefix: string;

  constructor(s3Client: S3Client, bucketName: string, prefix: string = "") {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.prefix = prefix.endsWith("/") ? prefix : prefix ? `${prefix}/` : "";
  }

  async saveIfNotExists(
    relativePath: string,
    payload: Buffer | string,
    options?: SaveIfNotExistsOptions,
  ): Promise<SaveIfNotExistsResult> {
    const key = this.resolveKey(relativePath);

    if (await this.exists(relativePath)) {
      return { path: key, created: false };
    }

    const body = typeof payload === "string" ? Buffer.from(payload) : payload;
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ...options,
    });

    await this.s3Client.send(putCommand);
    return { path: key, created: true };
  }

  async exists(relativePath: string): Promise<boolean> {
    const key = this.resolveKey(relativePath);
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(headCommand);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  private resolveKey(relativePath: string): string {
    const cleanedRelative = relativePath.replace(/^\/+/, "").trim();
    return `${this.prefix}${cleanedRelative}`;
  }
}
