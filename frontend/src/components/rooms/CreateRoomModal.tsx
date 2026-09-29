import { Lock, LockOpen, Minus, Plus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { Input, Label } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Modal } from "../ui/Modal";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 50;

type CreateRoomModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
};

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

const Actions = styled.div`
  display: flex;
  gap: 10px;

  button {
    flex: 1;
  }
`;

export function CreateRoomModal({ open, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [maxMembers, setMaxMembers] = useState(2);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onCreate();
  }

  const canSubmit = name.trim() && (!isPrivate || password);

  return (
    <Modal title="Nova sala de conversa" open={open} onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <Label>
          Nome da sala
          <Input
            placeholder="Ex: Projeto Alpha"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Label>

        <TypeGroup>
          <TypeOption type="button" $active={!isPrivate} onClick={() => setIsPrivate(false)}>
            <LockOpen size={20} />
            <strong>Pública</strong>
            <small>Qualquer um entra</small>
          </TypeOption>
          <TypeOption type="button" $active={isPrivate} onClick={() => setIsPrivate(true)}>
            <Lock size={20} />
            <strong>Privada</strong>
            <small>Protegida por senha</small>
          </TypeOption>
        </TypeGroup>

        <LimitRow>
          <div>
            <Users size={18} />
            <span>
              Limite de pessoas
              <small>
                Entre {MIN_MEMBERS} e {MAX_MEMBERS}
              </small>
            </span>
          </div>
          <Stepper>
            <StepButton
              type="button"
              aria-label="Diminuir limite"
              disabled={maxMembers <= MIN_MEMBERS}
              onClick={() => setMaxMembers((current) => current - 1)}
            >
              <Minus size={16} />
            </StepButton>
            <output>{maxMembers}</output>
            <StepButton
              type="button"
              aria-label="Aumentar limite"
              disabled={maxMembers >= MAX_MEMBERS}
              onClick={() => setMaxMembers((current) => current + 1)}
            >
              <Plus size={16} />
            </StepButton>
          </Stepper>
        </LimitRow>

        {isPrivate && (
          <Label>
            Senha da sala
            <PasswordInput
              placeholder="Senha para entrar"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
        )}

        <Actions>
          <Button type="button" $variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            Criar sala
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}
