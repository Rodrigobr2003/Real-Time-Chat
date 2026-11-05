import {
  Ban,
  DoorOpen,
  LogIn,
  LogOut,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserMinus,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import styled from "styled-components";
import { useAuth } from "../../hooks/useAuth";
import type { ISystemChatMessage } from "../../model/messageModel";
import type { SystemEventType } from "../../model/systemMessageModel";
import {
  getSystemMessageText,
  toSystemEvent,
} from "../../utils/systemMessageText";

type SystemMessageProps = {
  message: ISystemChatMessage;
};

type Tone = "neutral" | "info" | "warning" | "danger";

const EVENT_STYLE: Record<SystemEventType, { icon: LucideIcon; tone: Tone }> =
  {
    "user:kicked": { icon: DoorOpen, tone: "warning" },
    "user:blocked": { icon: Ban, tone: "danger" },
    "user:unblocked": { icon: UserRoundCheck, tone: "info" },
    "user:removed": { icon: UserMinus, tone: "warning" },
    "user:joined": { icon: LogIn, tone: "neutral" },
    "user:left": { icon: LogOut, tone: "neutral" },
    "admins:added": { icon: ShieldCheck, tone: "info" },
    "admin:removed": { icon: ShieldOff, tone: "neutral" },
    "chat:updated": { icon: Pencil, tone: "neutral" },
    "chat:deleted": { icon: Trash2, tone: "danger" },
  };

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-block: 4px;
`;

const Pill = styled.p<{ $tone: Tone }>`
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  max-width: min(85%, 480px);
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ $tone, theme }) =>
      $tone === "danger"
        ? "rgba(231, 76, 60, 0.35)"
        : $tone === "warning"
          ? "rgba(241, 196, 15, 0.3)"
          : theme.colors.border};
  background: ${({ $tone, theme }) =>
    $tone === "danger"
      ? "rgba(231, 76, 60, 0.12)"
      : $tone === "warning"
        ? "rgba(241, 196, 15, 0.1)"
        : theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12.5px;
  line-height: 1.45;
  text-align: center;
  overflow-wrap: anywhere;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

  b {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ $tone, theme }) =>
      $tone === "danger"
        ? theme.colors.danger
        : $tone === "warning"
          ? theme.colors.warning
          : $tone === "info"
            ? theme.colors.primary
            : theme.colors.textMuted};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 92%;
    font-size: 12px;
  }
`;

const formatFullDate = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

export function SystemMessage({ message }: SystemMessageProps) {
  const { user } = useAuth();
  const event = toSystemEvent(message);
  const { icon: Icon, tone } = EVENT_STYLE[event.type];

  return (
    <Wrapper role="status">
      <Pill $tone={tone} title={formatFullDate(message.createdAt)}>
        <Icon size={13} aria-hidden />
        <span>{getSystemMessageText(event, user?.id)}</span>
      </Pill>
    </Wrapper>
  );
}
