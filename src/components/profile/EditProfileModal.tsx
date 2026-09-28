import { Camera, Check, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import styled from "styled-components";
import {
  ACCENT_COLORS,
  STATUS_OPTIONS,
  type Profile,
  type UserStatus,
} from "../../mocks/profile";
import { getStatusColor } from "../../styles/status";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { FieldHint, Input, Label, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";

const BIO_MAX_LENGTH = 160;

type EditProfileModalProps = {
  profile: Profile;
  onClose: () => void;
  onSave: (profile: Profile) => void;
};

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
    ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active, theme }) =>
    $active ? "rgba(108, 92, 231, 0.12)" : theme.colors.surfaceAlt};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};

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
  outline: 2px solid ${({ $active, theme }) => ($active ? theme.colors.text : "transparent")};
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

export function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [draft, setDraft] = useState(profile);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <Modal title="Editar perfil" open onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <PhotoRow>
          <Avatar size={64} status={draft.status} color={draft.accentColor} />
          <div>
            <SmallButton type="button" $variant="ghost">
              <Camera size={16} />
              Alterar foto
            </SmallButton>
            <SmallButton type="button" $variant="ghost">
              <Trash2 size={16} />
              Remover
            </SmallButton>
          </div>
        </PhotoRow>

        <Label>
          Nome de exibição
          <Input value={draft.name} onChange={(event) => update("name", event.target.value)} />
        </Label>

        <Label>
          Usuário
          <UsernameField>
            <span>@</span>
            <Input
              value={draft.username}
              onChange={(event) =>
                update("username", event.target.value.replace(/\s/g, "").toLowerCase())
              }
            />
          </UsernameField>
        </Label>

        <Label>
          Descrição
          <Textarea
            value={draft.bio}
            maxLength={BIO_MAX_LENGTH}
            placeholder="Conte um pouco sobre esta máquina..."
            onChange={(event) => update("bio", event.target.value)}
          />
          <FieldHint>
            {draft.bio.length}/{BIO_MAX_LENGTH}
          </FieldHint>
        </Label>

        <Label>
          E-mail
          <Input
            type="email"
            value={draft.email}
            onChange={(event) => update("email", event.target.value)}
          />
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
                $active={draft.accentColor === color}
                onClick={() => update("accentColor", color)}
                aria-label={`Cor ${color}`}
              >
                {draft.accentColor === color && <Check size={16} />}
              </Swatch>
            ))}
          </Swatches>
        </Group>

        <Actions>
          <Button type="button" $variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!draft.name.trim() || !draft.username}>
            Salvar
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}
