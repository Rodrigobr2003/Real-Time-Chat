import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import mongoose from "mongoose";

const BUCKET_NAME = "attachments";

export interface StorageUploadInput {
  source: Readable;
  filename: string;
  contentType: string;
  metadata: Record<string, unknown>;
}

export interface StorageUploadResult {
  fileId: string;
  storedSize: number;
}

export interface IAttachmentStorageRepository {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  openDownload(fileId: string): Readable;
  delete(fileIds: string[]): Promise<void>;
}

export class GridFSAttachmentStorageRepository
  implements IAttachmentStorageRepository
{
  private bucket?: mongoose.mongo.GridFSBucket;

  private getBucket() {
    const db = mongoose.connection.db;

    if (!db) throw new Error("Banco de dados não conectado");

    this.bucket ??= new mongoose.mongo.GridFSBucket(db, {
      bucketName: BUCKET_NAME,
    });

    return this.bucket;
  }

  async upload({ source, filename, contentType, metadata }: StorageUploadInput) {
    const stream = this.getBucket().openUploadStream(filename, {
      metadata: { ...metadata, contentType },
    });

    try {
      await pipeline(source, stream);
    } catch (err) {
      await this.delete([stream.id.toString()]);
      throw err;
    }

    return { fileId: stream.id.toString(), storedSize: stream.length };
  }

  openDownload(fileId: string) {
    return this.getBucket().openDownloadStream(
      new mongoose.Types.ObjectId(fileId),
    );
  }

  async delete(fileIds: string[]) {
    const bucket = this.getBucket();

    await Promise.all(
      fileIds.map((fileId) =>
        bucket
          .delete(new mongoose.Types.ObjectId(fileId))
          .catch(() => undefined),
      ),
    );
  }
}
