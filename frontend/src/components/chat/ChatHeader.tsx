import { ArrowLeft, Lock, LockOpen, MoreVertical, Users } from "lucide-react";
import styled from "styled-components";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/Button";

type ChatHeaderProps = {
  roomName: string;
  roomId: string;
  isPrivate: boolean;
  members: number;
  maxMembers: number;
  onBack: () => void;
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

const Online = styled.span`
  color: ${({ theme }) => theme.colors.success};
`;

export function ChatHeader({
  roomName,
  roomId,
  isPrivate,
  members,
  maxMembers,
  onBack,
}: ChatHeaderProps) {
  return (
    <Header>
      <IconButton onClick={onBack} aria-label="Voltar">
        <ArrowLeft size={20} />
      </IconButton>
      <Avatar name={roomName} status="online" />
      <Info>
        <strong>
          {roomName}
          {isPrivate ? <Lock size={14} /> : <LockOpen size={14} />}
        </strong>
        <Details>
          <Online>online</Online>·
          <span>
            <Users size={12} />
            {members}/{maxMembers} pessoas
          </span>
          · sala {roomId}
        </Details>
      </Info>
      <IconButton aria-label="Mais opções">
        <MoreVertical size={20} />
      </IconButton>
    </Header>
  );
}
