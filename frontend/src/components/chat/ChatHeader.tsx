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
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
  }
`;

const Details = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    display: flex;
    align-items: center;
    gap: 4px;
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
      {photoURL ? (
        <PhotoButton
          type="button"
          onClick={() => setIsPhotoOpen(true)}
          aria-label="Ver foto da sala"
        >
          {avatar}
        </PhotoButton>
      ) : (
        avatar
      )}
      <Info>
        <strong>
          {roomName}
          {isPrivate ? <Lock size={14} /> : <LockOpen size={14} />}
        </strong>
        <Details>
          <Online>online</Online>·
          <ConnectedUsersTooltip users={connectedUsers} isLoading={isLoadingUsers}>
            <span>
              <Users size={12} />
              {members}/{maxMembers} pessoas
            </span>
          </ConnectedUsersTooltip>
          · sala {roomId}
        </Details>
      </Info>
      {onOpenSettings && (
        <IconButton aria-label="Mais opções" onClick={onOpenSettings}>
          <MoreVertical size={20} />
        </IconButton>
      )}

      {photoURL && (
        <Modal title={roomName} open={isPhotoOpen} onClose={() => setIsPhotoOpen(false)}>
          <FullPhoto src={photoURL} alt={`Foto da sala ${roomName}`} />
        </Modal>
      )}
    </Header>
  );
}
