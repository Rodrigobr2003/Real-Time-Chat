import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { createGunzip, createGzip } from "node:zlib";
import sharp from "sharp";
import {
  ATTACHMENTS_MAX_MESSAGE_SIZE,
  ATTACHMENTS_PER_MESSAGE,
  ATTACHMENTS_USER_QUOTA,
  ATTACHMENT_NAME_MAX_LENGTH,
  GZIP_EXTENSIONS,
  IMAGE_RECOMPRESS_EXTENSIONS,
  findAttachmentCategory,
  type AttachmentCategory,
} from "@config/attachments";
import { AttachmentError } from "@errors/AttachmentError";
import type { IAttachmentStorageRepository } from "@repositories/AttachmentStorageRepository";
import type { IMessageRepository } from "@repositories/MessageRepository";
import type { AttachmentDoc, StoredAttachment } from "@typings/message";
import { matchesSignature, readSignatureSample } from "@utils/fileSignature";

const IMAGE_MAX_DIMENSION = 2560;
const IMAGE_QUALITY = 80;
const IMAGE_MAX_INPUT_PIXELS = 60_000_000;
const GZIP_LEVEL = 6;

export interface UploadedFile {
  path: string;
  originalname: string;
}

interface PreparedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  category: AttachmentCategory;
}

interface StoreContext {
  chatId: string;
  userId: string;
}

export interface AttachmentDownload {
  stream: Readable;
  name: string;
  mimeType: string;
  size: number;
}

const toMegabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

const decodeName = (name: string) => {
  const utf8 = Buffer.from(name, "latin1").toString("utf8");

  return utf8.includes("�") ? name : utf8;
};

const sanitizeName = (rawName: string, extension: string) => {
  const name = decodeName(rawName)
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const suffix = `.${extension}`;
  const base = name.toLowerCase().endsWith(suffix)
    ? name.slice(0, -suffix.length)
    : name;
  const safeBase = (base || "arquivo").slice(
    0,
    ATTACHMENT_NAME_MAX_LENGTH - suffix.length,
  );

  return `${safeBase}${suffix}`;
};

const getExtension = (name: string) => {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

export class AttachmentService {
  constructor(
    private readonly storage: IAttachmentStorageRepository,
    private readonly messageRepository: IMessageRepository,
  ) {}

  async prepare(files: UploadedFile[], userId: string): Promise<PreparedFile[]> {
    if (files.length === 0) {
      throw new AttachmentError("Envie pelo menos um arquivo");
    }

    if (files.length > ATTACHMENTS_PER_MESSAGE) {
      throw new AttachmentError(
        `Envie no máximo ${ATTACHMENTS_PER_MESSAGE} arquivos por mensagem`,
      );
    }

    const prepared = await Promise.all(files.map((file) => this.inspect(file)));
    const total = prepared.reduce((sum, file) => sum + file.size, 0);

    if (total > ATTACHMENTS_MAX_MESSAGE_SIZE) {
      throw new AttachmentError(
        `Os anexos de uma mensagem somam no máximo ${toMegabytes(ATTACHMENTS_MAX_MESSAGE_SIZE)}`,
        413,
      );
    }

    const used = await this.messageRepository.sumStoredSizeByOwner(userId);

    if (used + total > ATTACHMENTS_USER_QUOTA) {
      throw new AttachmentError(
        `Você atingiu o limite de ${toMegabytes(ATTACHMENTS_USER_QUOTA)} em anexos. Apague anexos antigos para enviar novos`,
        413,
      );
    }

    return prepared;
  }

  private async inspect(file: UploadedFile): Promise<PreparedFile> {
    const extension = getExtension(decodeName(file.originalname));
    const category = findAttachmentCategory(extension);

    if (!category) {
      throw new AttachmentError(`Formato .${extension || "?"} não é permitido`);
    }

    const name = sanitizeName(file.originalname, extension);
    const { size } = await stat(file.path);

    if (size === 0) {
      throw new AttachmentError(`O arquivo "${name}" está vazio`);
    }

    if (size > category.maxSize) {
      throw new AttachmentError(
        `"${name}" passou do limite de ${toMegabytes(category.maxSize)} para ${category.label}`,
        413,
      );
    }

    const sample = await readSignatureSample(file.path);

    if (!matchesSignature(extension, sample)) {
      throw new AttachmentError(
        `O conteúdo de "${name}" não corresponde a um arquivo .${extension}`,
      );
    }

    return { path: file.path, name, extension, size, category };
  }

  async store(
    files: PreparedFile[],
    context: StoreContext,
  ): Promise<StoredAttachment[]> {
    const stored: StoredAttachment[] = [];

    try {
      for (const file of files) {
        stored.push(await this.storeOne(file, context));
      }
    } catch (err) {
      await this.discard(stored.map(({ fileId }) => fileId));
      throw err;
    }

    return stored;
  }

  private async storeOne(
    file: PreparedFile,
    context: StoreContext,
  ): Promise<StoredAttachment> {
    const mimeType = file.category.types[file.extension];
    const upload = (source: Readable) =>
      this.storage.upload({
        source,
        filename: file.name,
        contentType: mimeType,
        metadata: { ...context, kind: file.category.kind },
      });
    const base = {
      kind: file.category.kind,
      name: file.name,
      extension: file.extension,
      mimeType,
    };

    if (IMAGE_RECOMPRESS_EXTENSIONS.has(file.extension)) {
      const image = await this.recompressImage(file);

      if (image && image.length < file.size) {
        const { fileId, storedSize } = await upload(Readable.from(image));

        return { ...base, fileId, size: image.length, storedSize, compression: "image" };
      }
    }

    if (GZIP_EXTENSIONS.has(file.extension)) {
      const { fileId, storedSize } = await upload(
        createReadStream(file.path).pipe(createGzip({ level: GZIP_LEVEL })),
      );

      return { ...base, fileId, size: file.size, storedSize, compression: "gzip" };
    }

    const { fileId, storedSize } = await upload(createReadStream(file.path));

    return { ...base, fileId, size: file.size, storedSize, compression: "none" };
  }

  private async recompressImage(file: PreparedFile) {
    try {
      const image = sharp(file.path, {
        limitInputPixels: IMAGE_MAX_INPUT_PIXELS,
        failOn: "error",
        animated: file.extension === "webp",
      })
        .rotate()
        .resize(IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        });

      if (file.extension === "png") {
        return await image.png({ compressionLevel: 9, effort: 10 }).toBuffer();
      }

      if (file.extension === "webp") {
        return await image.webp({ quality: IMAGE_QUALITY }).toBuffer();
      }

      return await image
        .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
        .toBuffer();
    } catch {
      throw new AttachmentError(`A imagem "${file.name}" está corrompida`);
    }
  }

  async discard(fileIds: string[]) {
    if (fileIds.length === 0) return;

    try {
      await this.storage.delete(fileIds);
    } catch (err) {
      console.error("Falha ao remover anexos", fileIds, err);
    }
  }

  open(attachment: AttachmentDoc): AttachmentDownload {
    const source = this.storage.openDownload(attachment.fileId.toString());
    const stream =
      attachment.compression === "gzip" ? source.pipe(createGunzip()) : source;

    if (stream !== source) {
      source.on("error", (err) => stream.destroy(err));
    }

    return {
      stream,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }
}
