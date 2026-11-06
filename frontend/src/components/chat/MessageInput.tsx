import { SendHorizontal } from "lucide-react";
import { useRef, type FormEvent } from "react";
import styled from "styled-components";
import { MESSAGE_MAX_LENGTH } from "../../model/messageModel";
import { EmojiPickerButton } from "./EmojiPickerButton";

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

const Bar = styled.form`
  display: flex;
  align-items: center;
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

const FieldBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const InputEmoji = styled(EmojiPickerButton)`
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  align-items: center;
`;

const Field = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 46px;
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
  disabled = false,
}: MessageInputProps) {
  const fieldRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim() && !disabled) onSend();
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
      <FieldBox>
        <Field
          ref={fieldRef}
          placeholder="Digite uma mensagem..."
          value={value}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputEmoji onSelect={insertEmoji} disabled={disabled} />
      </FieldBox>
      <SendButton type="submit" disabled={!value.trim() || disabled} aria-label="Enviar">
        <SendHorizontal size={20} />
      </SendButton>
    </Bar>
  );
}
