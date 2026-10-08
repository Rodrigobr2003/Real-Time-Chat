import { Camera, Check, Trash2 } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import styled from "styled-components";
import { useUserUpdate } from "../../hooks/useUserUpdate";
import { ACCENT_COLORS, STATUS_OPTIONS } from "../../mocks/profile";
import {
  USER_PHOTO_ACCEPTED_TYPES,
  USER_PHOTO_MAX_SIZE,
  type IUserProfileFields,
  type UserStatus,
} from "../../model/userModel";
import { getStatusColor } from "../../styles/status";
import { getApiErrors } from "../../utils/apiErrors";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { FieldError, FieldHint, Input, Label, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";

const BIO_MAX_LENGTH = 280;

type EditProfileModalProps = {
  onClose: () => void;
};

type FieldErrors = Partial<Record<keyof IUserProfileFields, string>>;

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

const UsernameField = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  span {
    position: absolute;
    left: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
    pointer-events: none;
  }

  input {
    padding-left: 30px;
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

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const StatusOption = styled.button<{ $active: boolean; $status: UserStatus }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 13px;
  font-weight: 600;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? "rgba(108, 92, 231, 0.12)" : theme.colors.surfaceAlt};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text : theme.colors.textMuted};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $status, theme }) => getStatusColor(theme, $status)};
  }
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

export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const {
    updateDTO: draft,
    applyUpdateChanges,
    changedFields,
    hasChanges,
    resetUpdateDTO,
    updateUserMutation,
    isUpdatePending,
  } = useUserUpdate();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [filePreviewURL, setFilePreviewURL] = useState<string | null>(null);
  const filePreviewRef = useRef<string | null>(null);

  const photoPreview =
    draft.userPhoto instanceof File ? filePreviewURL : draft.userPhoto;

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

  function update<K extends keyof IUserProfileFields>(
    key: K,
    value: IUserProfileFields[K],
  ) {
    applyUpdateChanges(key, value);
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!(USER_PHOTO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      return setErrors((current) => ({
        ...current,
        userPhoto: "Use uma imagem JPG, PNG ou WEBP",
      }));
    }

    if (file.size > USER_PHOTO_MAX_SIZE) {
      return setErrors((current) => ({
        ...current,
        userPhoto: "A imagem deve ter no máximo 5 MB",
      }));
    }

    setFilePreview(file);
    update("userPhoto", file);
  }

  function handleClose() {
    resetUpdateDTO();
    onClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!hasChanges) return handleClose();

    updateUserMutation(changedFields, {
      onSuccess: onClose,
      onError: (error) => {
        const { message, fields } = getApiErrors(error);

        if (fields && Object.keys(fields).length > 0) setErrors(fields);
        else setFormError(message);
      },
    });
  }

  return (
    <Modal title="Editar perfil" open onClose={handleClose}>
      <Form onSubmit={handleSubmit}>
        <PhotoRow>
          <Avatar
            size={64}
            src={photoPreview ?? undefined}
            status={draft.status}
            color={draft.profileBgColor}
          />
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept={USER_PHOTO_ACCEPTED_TYPES.join(",")}
              onChange={handlePhotoChange}
              hidden
            />
            <SmallButton
              type="button"
              $variant="ghost"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={16} />
              Alterar foto
            </SmallButton>
            <SmallButton
              type="button"
              $variant="ghost"
              onClick={() => update("userPhoto", null)}
              disabled={!draft.userPhoto}
            >
              <Trash2 size={16} />
              Remover
            </SmallButton>
          </div>
        </PhotoRow>
        {errors.userPhoto && <FieldError>{errors.userPhoto}</FieldError>}

        <Label>
          Nome de exibição
          <Input
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Label>

        <Label>
          Usuário
          <UsernameField>
            <span>@</span>
            <Input
              value={draft.user}
              onChange={(event) =>
                update(
                  "user",
                  event.target.value.replace(/\s/g, "").toLowerCase(),
                )
              }
              aria-invalid={!!errors.user}
            />
          </UsernameField>
          {errors.user && <FieldError>{errors.user}</FieldError>}
        </Label>

        <Label>
          Descrição
          <Textarea
            value={draft.description}
            maxLength={BIO_MAX_LENGTH}
            placeholder="Conte um pouco sobre esta máquina..."
            onChange={(event) => update("description", event.target.value)}
          />
          <FieldHint>
            {draft.description.length}/{BIO_MAX_LENGTH}
          </FieldHint>
          {errors.description && <FieldError>{errors.description}</FieldError>}
        </Label>

        <Label>
          E-mail
          <Input
            type="email"
            value={draft.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Label>

        <Group>
          <GroupLabel>Status</GroupLabel>
          <StatusGrid>
            {STATUS_OPTIONS.map((option) => (
              <StatusOption
                key={option.value}
                type="button"
                $active={draft.status === option.value}
                $status={option.value}
                onClick={() => update("status", option.value)}
              >
                {option.label}
              </StatusOption>
            ))}
          </StatusGrid>
        </Group>

        <Group>
          <GroupLabel>Cor do perfil</GroupLabel>
          <Swatches>
            {ACCENT_COLORS.map((color) => (
              <Swatch
                key={color}
                type="button"
                $color={color}
                $active={draft.profileBgColor === color}
                onClick={() => update("profileBgColor", color)}
                aria-label={`Cor ${color}`}
              >
                {draft.profileBgColor === color && <Check size={16} />}
              </Swatch>
            ))}
          </Swatches>
        </Group>

        {formError && <FieldError>{formError}</FieldError>}

        <Actions>
          <Button type="button" $variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isUpdatePending || !draft.name.trim() || !draft.user}
          >
            {isUpdatePending ? "Salvando..." : "Salvar"}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}
