import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useChat } from "../../hooks/useChat";
import { CHAT_PASSWORD_MAX_LENGTH, type IPublicChat } from "../../model/chatModel";
import { getApiErrors } from "../../utils/apiErrors";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Form } from "../ui/Card";
import { FieldError, Label } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { PasswordInput } from "../ui/PasswordInput";

type JoinPrivateRoomModalProps = {
  room: IPublicChat | null;
  onClose: () => void;
};

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  strong {
    display: block;
    font-size: 15px;
  }

  small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;

  button {
    flex: 1;
  }
`;

export function JoinPrivateRoomModal({ room, onClose }: JoinPrivateRoomModalProps) {
  const navigate = useNavigate();
  const { connectChatMutation, isConnectPending } = useChat();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = password.length > 0 && !isConnectPending;

  function handleClose() {
    setPassword("");
    setError("");
    onClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!room || !canSubmit) return;

    setError("");
    connectChatMutation(
      { chatId: room.chatId, password },
      {
        onSuccess: () => {
          handleClose();
          navigate(`/chat/${room.chatId}`, { state: { room } });
        },
        onError: (apiError) => {
          const { message, fields } = getApiErrors(apiError);
          setError(fields?.password ?? message);
        },
      },
    );
  }

  return (
    <Modal title="Sala privada" open={!!room} onClose={handleClose}>
      {room && (
        <Form onSubmit={handleSubmit}>
          <RoomInfo>
            <Avatar
              name={room.name}
              src={room.chatPhotoURL ?? undefined}
              color={room.chatBgColor}
              size={42}
            />
            <div>
              <strong>{room.name}</strong>
              <small>
                <Lock size={12} />
                Digite a senha para entrar
              </small>
            </div>
          </RoomInfo>

          <Label>
            Senha da sala
            <PasswordInput
              value={password}
              maxLength={CHAT_PASSWORD_MAX_LENGTH}
              autoComplete="off"
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              autoFocus
            />
            {error && <FieldError role="alert">{error}</FieldError>}
          </Label>

          <Actions>
            <Button type="button" $variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isConnectPending ? "Entrando..." : "Entrar"}
            </Button>
          </Actions>
        </Form>
      )}
    </Modal>
  );
}
