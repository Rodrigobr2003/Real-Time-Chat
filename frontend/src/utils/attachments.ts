import {
  FileArchive,
  FileText,
  Headphones,
  Image,
  type LucideIcon,
} from "lucide-react";

export type AttachmentKind = "media" | "document" | "audio" | "archive";

export type AttachmentSection = {
  kind: AttachmentKind;
  label: string;
  icon: LucideIcon;
  color: string;
  extensions: string[];
  maxSize: number;
};

const MB = 1024 * 1024;

export const ATTACHMENT_SECTIONS: AttachmentSection[] = [
  {
    kind: "media",
    label: "Fotos e vídeos",
    icon: Image,
    color: "#6c5ce7",
    extensions: ["webp", "jpg", "jpeg", "png", "gif", "mp4", "webm", "mov"],
    maxSize: 50 * MB,
  },
  {
    kind: "document",
    label: "Documentos",
    icon: FileText,
    color: "#0984e3",
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"],
    maxSize: 20 * MB,
  },
  {
    kind: "audio",
    label: "Áudio",
    icon: Headphones,
    color: "#e17055",
    extensions: ["mp3", "wav", "ogg", "m4a", "weba"],
    maxSize: 16 * MB,
  },
  {
    kind: "archive",
    label: "Arquivos compactados",
    icon: FileArchive,
    color: "#00b894",
    extensions: ["zip", "rar", "7z"],
    maxSize: 100 * MB,
  },
];

export const getExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

export const getAttachmentSection = (fileName: string) =>
  ATTACHMENT_SECTIONS.find(({ extensions }) =>
    extensions.includes(getExtension(fileName)),
  ) ?? ATTACHMENT_SECTIONS[1];

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[unit]}`;
};

export const formatDuration = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
