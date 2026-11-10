export const ATTACHMENT_KINDS = ["media", "document", "audio", "archive"] as const;

export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_COMPRESSIONS = ["none", "gzip", "image"] as const;

export type AttachmentCompression = (typeof ATTACHMENT_COMPRESSIONS)[number];

const MB = 1024 * 1024;

export interface AttachmentCategory {
  kind: AttachmentKind;
  label: string;
  maxSize: number;
  types: Record<string, string>;
}

export const ATTACHMENT_CATEGORIES: AttachmentCategory[] = [
  {
    kind: "media",
    label: "fotos e vídeos",
    maxSize: 50 * MB,
    types: {
      webp: "image/webp",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    },
  },
  {
    kind: "document",
    label: "documentos",
    maxSize: 20 * MB,
    types: {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      csv: "text/csv",
    },
  },
  {
    kind: "audio",
    label: "áudio",
    maxSize: 16 * MB,
    types: {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    },
  },
  {
    kind: "archive",
    label: "arquivos compactados",
    maxSize: 100 * MB,
    types: {
      zip: "application/zip",
      rar: "application/vnd.rar",
      "7z": "application/x-7z-compressed",
    },
  },
];

export const ATTACHMENT_MAX_FILE_SIZE = Math.max(
  ...ATTACHMENT_CATEGORIES.map(({ maxSize }) => maxSize),
);

export const ATTACHMENTS_PER_MESSAGE = 10;

export const ATTACHMENTS_MAX_MESSAGE_SIZE = 150 * MB;

export const ATTACHMENTS_USER_QUOTA = 1024 * MB;

export const ATTACHMENT_NAME_MAX_LENGTH = 150;

export const GZIP_EXTENSIONS = new Set(["txt", "csv", "doc", "xls", "ppt", "pdf", "wav"]);

export const IMAGE_RECOMPRESS_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const findAttachmentCategory = (extension: string) =>
  ATTACHMENT_CATEGORIES.find(({ types }) => extension in types) ?? null;
