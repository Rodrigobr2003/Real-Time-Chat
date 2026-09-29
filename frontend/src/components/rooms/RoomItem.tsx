import { Lock, LockOpen, Users } from "lucide-react";
import styled from "styled-components";
import type { Room } from "../../mocks/rooms";

type RoomItemProps = {
  room: Room;
  onClick: () => void;
};

const Item = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  text-align: left;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const LockBadge = styled.span<{ $private: boolean }>`
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $private }) =>
    $private ? "rgba(231, 76, 60, 0.12)" : "rgba(46, 204, 113, 0.12)"};
  color: ${({ $private, theme }) =>
    $private ? theme.colors.danger : theme.colors.success};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Meta = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

`;

const Capacity = styled.span<{ $full: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $full, theme }) =>
    $full ? "rgba(231, 76, 60, 0.12)" : theme.colors.surfaceAlt};
  color: ${({ $full, theme }) => ($full ? theme.colors.danger : theme.colors.textMuted)};
`;

export function RoomItem({ room, onClick }: RoomItemProps) {
  const isFull = room.members >= room.maxMembers;

  return (
    <Item onClick={onClick} disabled={isFull}>
      <LockBadge
        $private={room.isPrivate}
        title={room.isPrivate ? "Sala privada" : "Sala pública"}
      >
        {room.isPrivate ? <Lock size={18} /> : <LockOpen size={18} />}
      </LockBadge>
      <Info>
        <strong>{room.name}</strong>
        <p>{room.lastMessage}</p>
      </Info>
      <Meta>
        <time>{room.lastActivity}</time>
        <Capacity $full={isFull} title={isFull ? "Sala cheia" : "Pessoas na sala"}>
          <Users size={12} />
          {isFull ? "Cheia" : `${room.members}/${room.maxMembers}`}
        </Capacity>
      </Meta>
    </Item>
  );
}
