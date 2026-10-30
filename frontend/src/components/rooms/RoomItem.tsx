import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock, LockOpen, Users } from "lucide-react";
import type { MouseEvent } from "react";
import styled from "styled-components";
import type { IPublicChat } from "../../model/chatModel";
import { Avatar } from "../ui/Avatar";

type RoomItemProps = {
  room: IPublicChat;
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

const Info = styled.div`
  flex: 1;
  min-width: 0;

  p {
    min-height: 1lh;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  strong {
    min-width: 0;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Privacy = styled.span<{ $private: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: ${({ $private, theme }) =>
    $private ? theme.colors.danger : theme.colors.success};
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
  color: ${({ $full, theme }) =>
    $full ? theme.colors.danger : theme.colors.textMuted};
`;

const showTitleIfTruncated = (event: MouseEvent<HTMLElement>) => {
  const el = event.currentTarget;
  if (el.scrollWidth > el.clientWidth) el.title = el.textContent ?? "";
  else el.removeAttribute("title");
};

const formatCreatedAt = (createdAt: string) =>
  formatDistanceToNowStrict(new Date(createdAt), {
    locale: ptBR,
    addSuffix: true,
  });

export function RoomItem({ room, onClick }: RoomItemProps) {
  const isFull = room.usersCount >= room.userLimit;
  const isPrivate = room.privacy === "private";

  return (
    <Item onClick={onClick} disabled={isFull}>
      <Avatar
        name={room.name}
        src={room.chatPhotoURL ?? undefined}
        color={room.chatBgColor}
        size={42}
      />

      <Info>
        <NameRow>
          <strong onMouseEnter={showTitleIfTruncated}>{room.name}</strong>
          <Privacy
            $private={isPrivate}
            title={isPrivate ? "Sala privada" : "Sala pública"}
            aria-label={isPrivate ? "Sala privada" : "Sala pública"}
          >
            {isPrivate ? <Lock size={14} /> : <LockOpen size={14} />}
          </Privacy>
        </NameRow>

        <p onMouseEnter={showTitleIfTruncated}>
          {room.lastMessage && (
            <>
              <b>{room.lastMessage.owner.name}:</b> {room.lastMessage.content}
            </>
          )}
        </p>
      </Info>

      <Meta>
        <time dateTime={room.createdAt} title="Criada">
          {formatCreatedAt(room.createdAt)}
        </time>

        <Capacity
          $full={isFull}
          title={isFull ? "Sala cheia" : "Pessoas na sala"}
        >
          <Users size={12} />
          {isFull ? "Cheia" : `${room.usersCount}/${room.userLimit}`}
        </Capacity>
      </Meta>
    </Item>
  );
}
