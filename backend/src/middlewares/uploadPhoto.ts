import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { InvalidImageError } from "@errors/InvalidImageError";
import {
  CHAT_PHOTO_ACCEPTED_TYPES,
  CHAT_PHOTO_MAX_SIZE,
} from "@models/chatSchema";
import {
  USER_PHOTO_ACCEPTED_TYPES,
  USER_PHOTO_MAX_SIZE,
} from "@models/userSchema";

interface PhotoUploadOptions {
  field: string;
  acceptedTypes: string[];
  maxSize: number;
}

const toMegabytes = (bytes: number) => bytes / 1024 / 1024;

const createPhotoUpload = ({
  field,
  acceptedTypes,
  maxSize,
}: PhotoUploadOptions) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (acceptedTypes.includes(file.mimetype)) return cb(null, true);
      cb(new InvalidImageError("Use uma imagem JPG, PNG ou WEBP"));
    },
  }).single(field);

  const getUploadErrorMessage = (err: multer.MulterError) =>
    err.code === "LIMIT_FILE_SIZE"
      ? `A imagem deve ter no máximo ${toMegabytes(maxSize)} MB`
      : "Envio de imagem inválido";

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: unknown) => {
      if (!err) return next();

      if (
        err instanceof InvalidImageError ||
        err instanceof multer.MulterError
      ) {
        const message =
          err instanceof multer.MulterError
            ? getUploadErrorMessage(err)
            : err.message;

        return res.status(400).json({ errors: { [field]: [message] } });
      }

      next(err);
    });
  };
};

export const uploadUserPhoto = createPhotoUpload({
  field: "userPhoto",
  acceptedTypes: USER_PHOTO_ACCEPTED_TYPES,
  maxSize: USER_PHOTO_MAX_SIZE,
});

export const uploadChatPhoto = createPhotoUpload({
  field: "chatPhoto",
  acceptedTypes: CHAT_PHOTO_ACCEPTED_TYPES,
  maxSize: CHAT_PHOTO_MAX_SIZE,
});
