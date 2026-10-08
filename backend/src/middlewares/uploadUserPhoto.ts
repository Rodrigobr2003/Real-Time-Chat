import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { InvalidImageError } from "@errors/InvalidImageError";
import {
  USER_PHOTO_ACCEPTED_TYPES,
  USER_PHOTO_MAX_SIZE,
} from "@models/userSchema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: USER_PHOTO_MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (USER_PHOTO_ACCEPTED_TYPES.includes(file.mimetype))
      return cb(null, true);
    cb(new InvalidImageError("Use uma imagem JPG, PNG ou WEBP"));
  },
}).single("userPhoto");

const getUploadErrorMessage = (err: multer.MulterError) =>
  err.code === "LIMIT_FILE_SIZE"
    ? "A imagem deve ter no máximo 5 MB"
    : "Envio de imagem inválido";

export const uploadUserPhoto = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof InvalidImageError || err instanceof multer.MulterError) {
      const message =
        err instanceof multer.MulterError
          ? getUploadErrorMessage(err)
          : err.message;

      return res.status(400).json({ errors: { userPhoto: [message] } });
    }

    next(err);
  });
};
