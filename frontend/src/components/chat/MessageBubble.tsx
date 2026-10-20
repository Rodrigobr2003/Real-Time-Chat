import { Ban, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { IMessage } from "../../model/messageModel";
import { Avatar } from "../ui/Avatar";

type MessageBubbleProps = {
  message: IMessage;
  mine: boolean;
  onEdit: (message: IMessage) => void;
  onDelete: (message: IMessage) => void;
};

const Row = styled.div<{ $mine: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-direction: ${({ $mine }) => ($mine ? "row-reverse" : "row")};
`;

const MenuTrigger = styled.button<{ $open: boolean }>`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: inherit;
  color: inherit;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity 0.15s;

  &:focus-visible {
    opacity: 1;
  }
`;

const Bubble = styled.div<{ $mine: boolean }>`
  position: relative;
  min-width: 96px;
  max-width: min(70%, 520px);
  padding: 6px 10px 6px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  ${({ $mine }) =>
    $mine ? "border-top-right-radius: 4px;" : "border-top-left-radius: 4px;"}
  background: ${({ $mine, theme }) =>
    $mine ? theme.colors.bubbleMine : theme.colors.bubbleTheirs};
  color: ${({ $mine, theme }) => ($mine ? "#fff" : theme.colors.text)};
  line-height: 1.4;
  overflow-wrap: anywhere;
  white-space: pre-wrap;

  &:hover ${MenuTrigger} {
    opacity: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 85%;
  }
`;

const Menu = styled.ul`
  position: absolute;
  top: 28px;
  right: 4px;
  z-index: 5;
  min-width: 140px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
  white-space: nowrap;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 14px;
  color: ${({ $danger, theme }) =>
    $danger ? theme.colors.danger : theme.colors.text};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Author = styled.strong`
  display: block;
  margin-bottom: 2px;
  padding-right: 20px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
`;

const Deleted = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-style: italic;
  opacity: 0.75;
`;

const Meta = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.7;
`;

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function MessageBubble({
  message,
  mine,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isDeleted = !!message.deletedAt;
  const canManage = mine && !isDeleted;

  useEffect(() => {
    if (!isMenuOpen) return;

    const close = (event: MouseEvent) => {
      if (!bubbleRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isMenuOpen]);

  function handleAction(action: (message: IMessage) => void) {
    setIsMenuOpen(false);
    action(message);
  }

  return (
    <Row $mine={mine}>
      {!mine && (
        <Avatar
          name={message.owner.name}
          src={message.owner.userPhotoURL ?? undefined}
          color={message.owner.profileBgColor}
          size={32}
        />
      )}
      <Bubble $mine={mine} ref={bubbleRef}>
        {canManage && (
          <>
            <MenuTrigger
              type="button"
              $open={isMenuOpen}
              aria-label="Opções da mensagem"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <ChevronDown size={16} />
            </MenuTrigger>
            {isMenuOpen && (
              <Menu role="menu">
                <li>
                  <MenuItem type="button" onClick={() => handleAction(onEdit)}>
                    <Pencil size={14} />
                    Editar
                  </MenuItem>
                </li>
                <li>
                  <MenuItem
                    type="button"
                    $danger
                    onClick={() => handleAction(onDelete)}
                  >
                    <Trash2 size={14} />
                    Apagar
                  </MenuItem>
                </li>
              </Menu>
            )}
          </>
        )}
        {!mine && <Author>{message.owner.name}</Author>}
        {isDeleted ? (
          <Deleted>
            <Ban size={14} />
            Mensagem apagada
          </Deleted>
        ) : (
          message.content
        )}
        <Meta>
          {message.editedAt && !isDeleted && <span>Editada</span>}
          <time dateTime={message.createdAt}>
            {formatTime(message.createdAt)}
          </time>
        </Meta>
      </Bubble>
    </Row>
  );
}
