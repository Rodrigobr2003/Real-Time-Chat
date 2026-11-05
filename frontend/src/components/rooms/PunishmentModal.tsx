import { Ban, Clock } from "lucide-react";
import styled from "styled-components";
import type { IPunishmentInfo } from "../../model/chatModel";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type PunishmentModalProps = {
  punishment: IPunishmentInfo | null;
  roomName?: string;
  onClose: () => void;
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;

  p {
    font-size: 14px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  b {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const IconCircle = styled.div<{ $blocked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $blocked }) =>
    $blocked ? "rgba(231, 76, 60, 0.12)" : "rgba(241, 196, 15, 0.12)"};
  color: ${({ $blocked, theme }) =>
    $blocked ? theme.colors.danger : theme.colors.warning};
`;

const Until = styled.div`
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;

  small {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const formatUntil = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRemaining = (date: string) => {
  const minutes = Math.max(
    1,
    Math.ceil((new Date(date).getTime() - Date.now()) / 60_000),
  );

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.ceil(minutes / 60);

  if (hours < 24) return `${hours} h`;

  const days = Math.ceil(hours / 24);

  return `${days} ${days === 1 ? "dia" : "dias"}`;
};

export function PunishmentModal({
  punishment,
  roomName,
  onClose,
}: PunishmentModalProps) {
  const isBlocked = punishment?.type === "blocked";
  const room = roomName ? <b>{roomName}</b> : "esta sala";

  return (
    <Modal
      title={isBlocked ? "Você foi banido" : "Você está suspenso"}
      open={!!punishment}
      onClose={onClose}
    >
      {punishment && (
        <Content>
          <IconCircle $blocked={isBlocked} aria-hidden>
            {isBlocked ? <Ban size={26} /> : <Clock size={26} />}
          </IconCircle>

          {isBlocked ? (
            <p>
              Você foi banido de {room} e não pode mais entrar nela. Apenas um
              administrador da sala pode remover o banimento.
            </p>
          ) : (
            <p>
              Você foi suspenso de {room} e não pode entrar nela enquanto a
              suspensão estiver ativa.
            </p>
          )}

          {!isBlocked && punishment.expiresAt && (
            <Until>
              Liberado em <b>{formatUntil(punishment.expiresAt)}</b>
              <small>daqui a {formatRemaining(punishment.expiresAt)}</small>
            </Until>
          )}

          <Button $fullWidth onClick={onClose}>
            Entendi
          </Button>
        </Content>
      )}
    </Modal>
  );
}
