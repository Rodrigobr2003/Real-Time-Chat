import { ArrowLeft, Lock, LockOpen, MoreVertical, Users } from "lucide-react";
import { useState } from "react";
import styled from "styled-components";
import type { IConnectedUser } from "../../model/chatModel";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConnectedUsersTooltip } from "./ConnectedUsersTooltip";

type ChatHeaderProps = {
  roomName: string;
  roomId: string;
  isPrivate: boolean;
  members: number;
  maxMembers: number;
  photoURL?: string | null;
  color?: string;
  connectedUsers: IConnectedUser[];
  isLoadingUsers: boolean;
  onBack: () => void;
  onOpenSettings?: () => void;
};

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 8px;
    padding-inline: 6px 4px;
    padding-top: max(8px, env(safe-area-inset-top));
    padding-bottom: 8px;
  }
`;

const Summary = styled.div<{ $clickable: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 10px;
  }
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;

    > svg {
      flex-shrink: 0;
    }
  }
`;

const RoomName = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Details = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const RoomId = styled.span`
  min-width: 0;
  overflow: hidden;

  && {
    display: block;
    text-overflow: ellipsis;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    && {
      display: none;
    }
  }
`;

const PhotoButton = styled.button`
  display: flex;
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.full};
  cursor: zoom-in;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

const FullPhoto = styled.img`
  display: block;
  width: 100%;
  max-height: 70dvh;
  object-fit: contain;
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Online = styled.span`
  color: ${({ theme }) => theme.colors.success};
`;

export function ChatHeader({
  roomName,
  roomId,
  isPrivate,
  members,
  maxMembers,
  photoURL,
  color,
  connectedUsers,
  isLoadingUsers,
  onBack,
  onOpenSettings,
}: ChatHeaderProps) {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const avatar = (
    <Avatar
      name={roomName}
      src={photoURL ?? undefined}
      color={color}
      status="online"
    />
  );

  return (
    <Header>
      <IconButton onClick={onBack} aria-label="Voltar">
        <ArrowLeft size={20} />
      </IconButton>
      <Summary
        $clickable={!!onOpenSettings}
        onClick={onOpenSettings}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key !== "Enter" && event.key !== " ") return;

          event.preventDefault();
          onOpenSettings?.();
        }}
        role={onOpenSettings ? "button" : undefined}
        tabIndex={onOpenSettings ? 0 : undefined}
        aria-label={onOpenSettings ? "Abrir informações da sala" : undefined}
      >
        {photoURL ? (
          <PhotoButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsPhotoOpen(true);
            }}
            aria-label="Ver foto da sala"
          >
            {avatar}
          </PhotoButton>
        ) : (
          avatar
        )}
        <Info>
          <strong>
            <RoomName title={roomName}>{roomName}</RoomName>
            {isPrivate ? <Lock size={14} /> : <LockOpen size={14} />}
          </strong>
          <Details>
            <Online>online</Online>·
            <ConnectedUsersTooltip
              users={connectedUsers}
              isLoading={isLoadingUsers}
            >
              <span>
                <Users size={12} />
                {members}/{maxMembers} pessoas
              </span>
            </ConnectedUsersTooltip>
            <RoomId title={roomId}>· sala {roomId}</RoomId>
          </Details>
        </Info>
      </Summary>
      {onOpenSettings && (
        <IconButton aria-label="Mais opções" onClick={onOpenSettings}>
          <MoreVertical size={20} />
        </IconButton>
      )}

      {photoURL && (
        <Modal
          title={roomName}
          open={isPhotoOpen}
          onClose={() => setIsPhotoOpen(false)}
        >
          <FullPhoto src={photoURL} alt={`Foto da sala ${roomName}`} />
        </Modal>
      )}
    </Header>
  );
}
