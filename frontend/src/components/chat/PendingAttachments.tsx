import { X } from "lucide-react";
import styled from "styled-components";
import { formatFileSize, getAttachmentSection } from "../../utils/attachments";

type PendingAttachmentsProps = {
  files: File[];
  onRemove: (file: File) => void;
};

const List = styled.ul`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  list-style: none;
`;

const Chip = styled.li`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 210px;
  padding: 6px 30px 6px 6px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

const Thumb = styled.span<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $color }) => $color};
  color: #fff;
`;

const Info = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 50%;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.textMuted};
  transition:
    color 0.2s,
    background 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

function PendingAttachment({
  file,
  onRemove,
}: {
  file: File;
  onRemove: (file: File) => void;
}) {
  const section = getAttachmentSection(file.name);

  return (
    <Chip>
      <Thumb $color={section.color} title={section.label}>
        <section.icon size={18} />
      </Thumb>
      <Info>
        <strong title={file.name}>{file.name}</strong>
        <small>{formatFileSize(file.size)}</small>
      </Info>
      <RemoveButton
        type="button"
        onClick={() => onRemove(file)}
        aria-label={`Remover ${file.name}`}
      >
        <X size={14} />
      </RemoveButton>
    </Chip>
  );
}

export function PendingAttachments({ files, onRemove }: PendingAttachmentsProps) {
  return (
    <List aria-label="Arquivos anexados">
      {files.map((file) => (
        <PendingAttachment
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          onRemove={onRemove}
        />
      ))}
    </List>
  );
}
