import { SendHorizontal } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import styled from "styled-components";
import { MESSAGE_MAX_LENGTH } from "../../model/messageModel";
import type { AttachmentKind } from "../../utils/attachments";
import { AttachmentButton } from "./AttachmentButton";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { PendingAttachments } from "./PendingAttachments";

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (files: File[]) => void;
  onAttach?: (files: File[], kind: AttachmentKind) => void;
  disabled?: boolean;
};

const MAX_ATTACHMENTS = 10;

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const Bar = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 8px;
    padding-inline: 10px;
    padding-top: 8px;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
`;

const AttachError = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: inherit;
`;

const FieldBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const InputAttachment = styled(AttachmentButton)`
  && {
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    align-items: center;
  }
`;

const InputEmoji = styled(EmojiPickerButton)`
  && {
    position: absolute;
    left: 40px;
    top: 0;
    bottom: 0;
    align-items: center;
  }
`;

const Field = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 80px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    opacity 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function MessageInput({
  value,
  onChange,
  onSend,
  onAttach,
  disabled = false,
}: MessageInputProps) {
  const fieldRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [attachError, setAttachError] = useState("");

  function attach(selected: File[], kind: AttachmentKind) {
    setAttachError("");
    setFiles((current) => {
      const keys = new Set(current.map(fileKey));
      const fresh = selected.filter((file) => !keys.has(fileKey(file)));

      return [...current, ...fresh].slice(0, MAX_ATTACHMENTS);
    });
    onAttach?.(selected, kind);
  }

  function removeFile(file: File) {
    setFiles((current) => current.filter((item) => item !== file));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if ((!value.trim() && files.length === 0) || disabled) return;

    onSend(files);
    setFiles([]);
    setAttachError("");
  }

  function insertEmoji(emoji: string) {
    const field = fieldRef.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);

    if (next.length > MESSAGE_MAX_LENGTH) return;

    onChange(next);

    requestAnimationFrame(() => {
      const caret = start + emoji.length;
      field?.setSelectionRange(caret, caret);
    });
  }

  return (
    <Bar onSubmit={handleSubmit}>
      {files.length > 0 && (
        <PendingAttachments files={files} onRemove={removeFile} />
      )}
      {attachError && <AttachError role="alert">{attachError}</AttachError>}
      <Controls>
        <FieldBox>
          <Field
            ref={fieldRef}
            placeholder="Digite uma mensagem..."
            value={value}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(event) => onChange(event.target.value)}
          />
          <InputAttachment
            onSelect={attach}
            onReject={setAttachError}
            disabled={disabled}
          />
          <InputEmoji onSelect={insertEmoji} disabled={disabled} />
        </FieldBox>
        <SendButton type="submit" disabled={(!value.trim() && files.length === 0) || disabled} aria-label="Enviar">
          <SendHorizontal size={20} />
        </SendButton>
      </Controls>
    </Bar>
  );
}
