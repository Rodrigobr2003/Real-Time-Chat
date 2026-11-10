import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import {
  ATTACHMENTS_MAX_MESSAGE_SIZE,
  ATTACHMENTS_PER_MESSAGE,
  ATTACHMENT_MAX_FILE_SIZE,
  findAttachmentCategory,
} from "@config/attachments";
import { AttachmentError } from "@errors/AttachmentError";

export const ATTACHMENTS_FIELD = "attachments";

const UPLOAD_DIR = join(tmpdir(), "real-time-chat-uploads");
const MULTIPART_OVERHEAD = 1024 * 1024;

mkdirSync(UPLOAD_DIR, { recursive: true });

const getExtension = (name: string) => {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, _file, cb) => cb(null, randomUUID()),
  }),
  limits: {
    fileSize: ATTACHMENT_MAX_FILE_SIZE,
    files: ATTACHMENTS_PER_MESSAGE,
    fields: 4,
    fieldSize: 4 * 1024,
    parts: ATTACHMENTS_PER_MESSAGE + 4,
  },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname !== ATTACHMENTS_FIELD) {
      return cb(new AttachmentError("Campo de arquivo inválido"));
    }

    if (findAttachmentCategory(getExtension(file.originalname))) {
      return cb(null, true);
    }

    cb(new AttachmentError(`O arquivo "${file.originalname}" tem um formato não permitido`));
  },
}).array(ATTACHMENTS_FIELD, ATTACHMENTS_PER_MESSAGE);

const MULTER_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: `Cada arquivo pode ter no máximo ${ATTACHMENT_MAX_FILE_SIZE / 1024 / 1024} MB`,
  LIMIT_FILE_COUNT: `Envie no máximo ${ATTACHMENTS_PER_MESSAGE} arquivos por mensagem`,
  LIMIT_UNEXPECTED_FILE: "Campo de arquivo inválido",
};

export const uploadAttachments = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const length = Number(req.headers["content-length"] ?? 0);

  if (length > ATTACHMENTS_MAX_MESSAGE_SIZE + MULTIPART_OVERHEAD) {
    return res.status(413).json({
      message: `Os anexos de uma mensagem somam no máximo ${ATTACHMENTS_MAX_MESSAGE_SIZE / 1024 / 1024} MB`,
    });
  }

  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof AttachmentError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      return res
        .status(status)
        .json({ message: MULTER_MESSAGES[err.code] ?? "Envio de arquivos inválido" });
    }

    next(err);
  });
};

export const cleanupUploads = async (req: Request) => {
  const files = Array.isArray(req.files) ? req.files : [];

  await Promise.all(files.map(({ path }) => unlink(path).catch(() => undefined)));
};
