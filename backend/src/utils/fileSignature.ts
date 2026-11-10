import { open } from "node:fs/promises";

export const SIGNATURE_SAMPLE_SIZE = 4096;

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, index) => buffer[offset + index] === byte);

const ascii = (buffer: Buffer, text: string, offset = 0) =>
  startsWith(buffer, [...Buffer.from(text, "ascii")], offset);

const isZip = (b: Buffer) =>
  startsWith(b, [0x50, 0x4b, 0x03, 0x04]) ||
  startsWith(b, [0x50, 0x4b, 0x05, 0x06]);

const isOle = (b: Buffer) =>
  startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

const isIsoMedia = (b: Buffer) => ascii(b, "ftyp", 4);

const isRiff = (b: Buffer, format: string) =>
  ascii(b, "RIFF") && ascii(b, format, 8);

const isText = (b: Buffer) => {
  if (b.includes(0x00)) return false;

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(
      b.length === SIGNATURE_SAMPLE_SIZE ? b.subarray(0, -4) : b,
    );
    return true;
  } catch {
    return false;
  }
};

const isMp3 = (b: Buffer) =>
  ascii(b, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);

const SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  jpg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  jpeg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: (b) => ascii(b, "GIF87a") || ascii(b, "GIF89a"),
  webp: (b) => isRiff(b, "WEBP"),
  mp4: isIsoMedia,
  mov: (b) => isIsoMedia(b) || ascii(b, "moov", 4) || ascii(b, "wide", 4),
  webm: (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]),
  pdf: (b) => ascii(b, "%PDF-"),
  doc: isOle,
  xls: isOle,
  ppt: isOle,
  docx: isZip,
  xlsx: isZip,
  pptx: isZip,
  txt: isText,
  csv: isText,
  mp3: isMp3,
  wav: (b) => isRiff(b, "WAVE"),
  ogg: (b) => ascii(b, "OggS"),
  m4a: isIsoMedia,
  zip: isZip,
  rar: (b) => ascii(b, "Rar!\x1a\x07"),
  "7z": (b) => startsWith(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
};

export const readSignatureSample = async (path: string) => {
  const handle = await open(path, "r");

  try {
    const buffer = Buffer.alloc(SIGNATURE_SAMPLE_SIZE);
    const { bytesRead } = await handle.read(buffer, 0, SIGNATURE_SAMPLE_SIZE, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

export const matchesSignature = (extension: string, sample: Buffer) =>
  SIGNATURES[extension]?.(sample) ?? false;
