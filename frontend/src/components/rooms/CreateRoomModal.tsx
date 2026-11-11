import { Camera, Check, Lock, LockOpen, Minus, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import styled from "styled-components";
import { useChat } from "../../hooks/useChat";
import {
  CHAT_BG_COLORS,
  CHAT_MAX_USERS,
  CHAT_MIN_USERS,
  CHAT_NAME_MAX_LENGTH,
  CHAT_NAME_MIN_LENGTH,
  CHAT_PASSWORD_MAX_LENGTH,
  CHAT_PASSWORD_MIN_LENGTH,
  CHAT_PHOTO_ACCEPTED_TYPES,
  CHAT_PHOTO_MAX_SIZE,
  type ICreateChatDTO,
} from "../../model/chatModel";
import { getApiErrors } from "../../utils/apiErrors";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { FieldError, FieldHint, Input, Label } from "../ui/Input";
import { Modal } from "../ui/Modal";

type CreateRoomModalProps = {
  open: boolean;
  onClose: () => void;
};

type FieldErrors = Partial<Record<keyof ICreateChatDTO, string>>;

const PhotoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const SmallButton = styled(Button)`
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
`;

const TypeGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const TypeOption = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active, theme }) =>
    $active ? "rgba(108, 92, 231, 0.12)" : theme.colors.surfaceAlt};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  transition:
    border-color 0.2s,
    background 0.2s;

  strong {
    font-size: 14px;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const LimitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  > div:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  output {
    min-width: 32px;
    text-align: center;
    font-weight: 700;
  }
`;

const StepButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const GroupLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: #fff;
  outline: 2px solid
    ${({ $active, theme }) => ($active ? theme.colors.text : "transparent")};
  outline-offset: 2px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.1);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;

  button {
    flex: 1;
  }
`;

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const {
    createChatDTO: draft,
    applyCreateChatChanges,
    resetCreateChatDTO,
    createChatMutation,
    isCreatePending,
  } = useChat();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [filePreviewURL, setFilePreviewURL] = useState<string | null>(null);
  const filePreviewRef = useRef<string | null>(null);

  const photoPreview = draft.chatPhoto ? filePreviewURL : null;
  const isPrivate = draft.privacy === "private";
  const canSubmit =
    draft.name.trim().length >= CHAT_NAME_MIN_LENGTH &&
    (!isPrivate || draft.password.length >= CHAT_PASSWORD_MIN_LENGTH) &&
    !isCreatePending;

  useEffect(
    () => () => {
      if (filePreviewRef.current) URL.revokeObjectURL(filePreviewRef.current);
    },
    [],
  );

  function setFilePreview(file: File) {
    if (filePreviewRef.current) URL.revokeObjectURL(filePreviewRef.current);

    const url = URL.createObjectURL(file);
    filePreviewRef.current = url;
    setFilePreviewURL(url);
  }

  function update<K extends keyof ICreateChatDTO>(key: K, value: ICreateChatDTO[K]) {
    applyCreateChatChanges(key, value);
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!(CHAT_PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return setErrors((current) => ({
        ...current,
        chatPhoto: "Use uma imagem JPG, PNG ou WEBP",
      }));
    }

    if (file.size > CHAT_PHOTO_MAX_SIZE) {
      return setErrors((current) => ({
        ...current,
        chatPhoto: "A imagem deve ter no máximo 5 MB",
      }));
    }

    setFilePreview(file);
    update("chatPhoto", file);
  }

  function clearFeedback() {
    setErrors({});
    setFormError("");
  }

  function handleClose() {
    resetCreateChatDTO();
    clearFeedback();
    onClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!canSubmit) return;

    createChatMutation(draft, {
      onSuccess: () => {
        clearFeedback();
        onClose();
      },
      onError: (error) => {
        const { message, fields } = getApiErrors(error);

        if (fields && Object.keys(fields).length > 0) setErrors(fields);
        else setFormError(message);
      },
    });
  }

  return (
    <Modal title="Nova sala de conversa" open={open} onClose={handleClose}>
      <Form onSubmit={handleSubmit}>
        <PhotoRow>
          <Avatar
            size={64}
            name={draft.name.trim() || undefined}
            src={photoPreview ?? undefined}
            color={draft.chatBgColor}
          />
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept={CHAT_PHOTO_ACCEPTED_TYPES.join(",")}
              onChange={handlePhotoChange}
              hidden
            />
            <SmallButton
              type="button"
              $variant="ghost"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={16} />
              {draft.chatPhoto ? "Alterar foto" : "Adicionar foto"}
            </SmallButton>
            <SmallButton
              type="button"
              $variant="ghost"
              onClick={() => update("chatPhoto", null)}
              disabled={!draft.chatPhoto}
            >
              <Trash2 size={16} />
              Remover
            </SmallButton>
          </div>
        </PhotoRow>
        {errors.chatPhoto && <FieldError>{errors.chatPhoto}</FieldError>}

        <Label>
          Nome da sala
          <Input
            placeholder="Ex: Projeto Alpha"
            value={draft.name}
            maxLength={CHAT_NAME_MAX_LENGTH}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={!!errors.name}
            autoFocus
          />
          <FieldHint>
            {draft.name.length}/{CHAT_NAME_MAX_LENGTH}
          </FieldHint>
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Label>

        <TypeGroup>
          <TypeOption
            type="button"
            $active={draft.privacy === "public"}
            onClick={() => update("privacy", "public")}
          >
            <LockOpen size={20} />
            <strong>Pública</strong>
            <small>Qualquer um entra</small>
          </TypeOption>
          <TypeOption
            type="button"
            $active={draft.privacy === "private"}
            onClick={() => update("privacy", "private")}
          >
            <Lock size={20} />
            <strong>Privada</strong>
            <small>Acesso restrito</small>
          </TypeOption>
        </TypeGroup>
        {errors.privacy && <FieldError>{errors.privacy}</FieldError>}

        {isPrivate && (
          <Label>
            Senha da sala
            <Input
              type="password"
              placeholder="Senha para entrar na sala"
              value={draft.password}
              minLength={CHAT_PASSWORD_MIN_LENGTH}
              maxLength={CHAT_PASSWORD_MAX_LENGTH}
              autoComplete="new-password"
              onChange={(event) => update("password", event.target.value)}
              aria-invalid={!!errors.password}
            />
            <FieldHint>Mínimo de {CHAT_PASSWORD_MIN_LENGTH} caracteres</FieldHint>
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </Label>
        )}

        <LimitRow>
          <div>
            <Users size={18} />
            <span>
              Limite de pessoas
              <small>
                Entre {CHAT_MIN_USERS} e {CHAT_MAX_USERS}
              </small>
            </span>
          </div>
          <Stepper>
            <StepButton
              type="button"
              aria-label="Diminuir limite"
              disabled={draft.userLimit <= CHAT_MIN_USERS}
              onClick={() => update("userLimit", draft.userLimit - 1)}
            >
              <Minus size={16} />
            </StepButton>
            <output>{draft.userLimit}</output>
            <StepButton
              type="button"
              aria-label="Aumentar limite"
              disabled={draft.userLimit >= CHAT_MAX_USERS}
              onClick={() => update("userLimit", draft.userLimit + 1)}
            >
              <Plus size={16} />
            </StepButton>
          </Stepper>
        </LimitRow>
        {errors.userLimit && <FieldError>{errors.userLimit}</FieldError>}

        <Group>
          <GroupLabel>Cor da sala</GroupLabel>
          <Swatches>
            {CHAT_BG_COLORS.map((color) => (
              <Swatch
                key={color}
                type="button"
                $color={color}
                $active={draft.chatBgColor === color}
                onClick={() => update("chatBgColor", color)}
                aria-label={`Cor ${color}`}
              >
                {draft.chatBgColor === color && <Check size={16} />}
              </Swatch>
            ))}
          </Swatches>
          {errors.chatBgColor && <FieldError>{errors.chatBgColor}</FieldError>}
        </Group>

        {formError && <FieldError>{formError}</FieldError>}

        <Actions>
          <Button type="button" $variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isCreatePending ? "Criando..." : "Criar sala"}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}
