import { SendHorizontal } from "lucide-react";
import type { FormEvent } from "react";
import styled from "styled-components";

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

const Bar = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Field = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 16px;
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

export function MessageInput({ value, onChange, onSend }: MessageInputProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) onSend();
  }

  return (
    <Bar onSubmit={handleSubmit}>
      <Field
        placeholder="Digite uma mensagem..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <SendButton type="submit" disabled={!value.trim()} aria-label="Enviar">
        <SendHorizontal size={20} />
      </SendButton>
    </Bar>
  );
}
