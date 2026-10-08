import sharp from "sharp";
import { InvalidImageError } from "@errors/InvalidImageError";

const USER_PHOTO_SIZE = 256;
const USER_PHOTO_QUALITY = 75;
const MAX_INPUT_PIXELS = 40_000_000;

export const compressUserPhoto = async (input: Buffer) => {
  try {
    return await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(USER_PHOTO_SIZE, USER_PHOTO_SIZE, { fit: "cover" })
      .webp({ quality: USER_PHOTO_QUALITY, effort: 6 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("Imagem inválida ou corrompida");
  }
};
