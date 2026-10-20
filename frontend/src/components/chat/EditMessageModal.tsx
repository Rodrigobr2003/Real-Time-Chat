import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { MESSAGE_MAX_LENGTH, type IMessage } from "../../model/messageModel";
import { Button } from "../ui/Button";
import { FieldError, FieldHint, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";

type EditMessageModalProps = {
  message: IMessage;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
  onSave: (content: string) => void;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

export function EditMessageModal({
  message,
  isSaving,
  error,
  onClose,
  onSave,
}: EditMessageModalProps) {
  const [content, setContent] = useState(message.content);
  const trimmed = content.trim();
  const canSave = !!trimmed && trimmed !== message.content && !isSaving;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSave) onSave(trimmed);
  }

  return (
    <Modal title="Editar mensagem" open onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <Textarea
          autoFocus
          value={content}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) handleSubmit(event);
          }}
        />
        <FieldHint>
          {content.length}/{MESSAGE_MAX_LENGTH}
        </FieldHint>
        {error && <FieldError>{error}</FieldError>}
        <Actions>
          <Button type="button" $variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSave}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}
