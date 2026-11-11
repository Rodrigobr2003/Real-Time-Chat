import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { downloadAttachment } from "../../api/messageHelpers";
import type { IMessageAttachment } from "../../model/messageModel";
import {
  formatFileSize,
  getAttachmentSection,
  getExtension,
} from "../../utils/attachments";

type MessageAttachmentProps = {
  attachment: IMessageAttachment;
  mine: boolean;
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Card = styled.div<{ $mine: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(300px, 100%);
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $mine }) =>
    $mine ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.05)"};
  white-space: normal;
`;

const Icon = styled.span<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $color }) => $color};
  color: #fff;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: 11px;
    opacity: 0.7;
  }
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid currentColor;
  color: inherit;
  opacity: 0.8;
  transition:
    opacity 0.2s,
    background 0.2s;

  &:hover:not(:disabled) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    cursor: progress;
  }

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const saveBlob = (blob: Blob, name: string) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

export function MessageAttachment({ attachment, mine }: MessageAttachmentProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const section = getAttachmentSection(attachment.name);
  const extension = getExtension(attachment.name).toUpperCase();

  async function download() {
    if (!attachment.url) return;

    setIsDownloading(true);

    try {
      saveBlob(await downloadAttachment(attachment.url), attachment.name);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card $mine={mine}>
      <Icon $color={section.color} title={section.label}>
        <section.icon size={20} />
      </Icon>
      <Info>
        <strong title={attachment.name}>{attachment.name}</strong>
        <small>
          {formatFileSize(attachment.size)} · {extension}
        </small>
      </Info>
      <DownloadButton
        type="button"
        onClick={download}
        disabled={isDownloading || !attachment.url}
        aria-label={`Baixar ${attachment.name}`}
        title="Baixar"
      >
        {isDownloading ? (
          <LoaderCircle size={16} className="spin" />
        ) : (
          <Download size={16} />
        )}
      </DownloadButton>
    </Card>
  );
}
