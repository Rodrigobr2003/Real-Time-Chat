import sharp from "sharp";
import { InvalidImageError } from "@errors/InvalidImageError";

const PHOTO_SIZE = 256;
const PHOTO_QUALITY = 75;
const MAX_INPUT_PIXELS = 40_000_000;

export const compressPhoto = async (input: Buffer) => {
  try {
    return await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover" })
      .webp({ quality: PHOTO_QUALITY, effort: 6 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("Imagem inválida ou corrompida");
  }
};

export const downloadPhoto = async (url: string | null) => {
  if (!url) return null;

  try {
    const res = await fetch(url.replace(/=s\d+-c$/, "=s256-c"));
    if (!res.ok) return null;
    return await compressPhoto(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
};
