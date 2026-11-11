import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { IMessageReaction } from "../../model/messageModel";
import { Avatar } from "../ui/Avatar";

type MessageReactionsProps = {
  reactions: IMessageReaction[];
  mine: boolean;
  currentUserId: string | undefined;
  onRemove: (emoji: string) => void;
};

const Wrapper = styled.div<{ $mine: boolean }>`
  position: absolute;
  bottom: -14px;
  ${({ $mine }) => ($mine ? "right: 10px;" : "left: 10px;")}
  z-index: 2;
  white-space: normal;
`;

const Pill = styled.button<{ $reacted: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 7px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $reacted, theme }) =>
      $reacted ? theme.colors.primary : theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);

  small {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 600;
  }
`;

const Tooltip = styled.div<{ $mine: boolean }>`
  position: absolute;
  bottom: calc(100% + 6px);
  ${({ $mine }) => ($mine ? "right: 0;" : "left: 0;")}
  width: 240px;
  max-width: calc(100vw - 32px);
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.3;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 8px;
  }
`;

const Header = styled.p`
  padding: 4px 6px 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const RemoveRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const Person = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Emoji = styled.span`
  flex-shrink: 0;
  font-size: 20px;
`;

export function MessageReactions({
  reactions,
  mine,
  currentUserId,
  onRemove,
}: MessageReactionsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isOpen = isHovered || isPinned;

  const myReaction = reactions.find(({ user }) => user.id === currentUserId);
  const emojis = [...new Set(reactions.map(({ emoji }) => emoji))];
  const sorted = [...reactions].sort(
    (a, b) =>
      Number(b.user.id === currentUserId) - Number(a.user.id === currentUserId),
  );

  useEffect(() => {
    if (!isPinned) return;

    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsPinned(false);
      }
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isPinned]);

  function remove(emoji: string) {
    setIsPinned(false);
    setIsHovered(false);
    onRemove(emoji);
  }

  return (
    <Wrapper
      ref={wrapperRef}
      $mine={mine}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Pill
        type="button"
        $reacted={!!myReaction}
        onClick={() => setIsPinned((pinned) => !pinned)}
        aria-label={`Ver reações: ${emojis.join(" ")}`}
        aria-expanded={isOpen}
      >
        {emojis.slice(0, 3).join("")}
        {reactions.length > 1 && <small>{reactions.length}</small>}
      </Pill>

      {isOpen && (
        <Tooltip $mine={mine} role="dialog" aria-label="Reações">
          <Header>
            {reactions.length} {reactions.length === 1 ? "reação" : "reações"}
          </Header>
          <List>
            {sorted.map(({ user, emoji }) => {
              const isMe = user.id === currentUserId;
              const content = (
                <>
                  <Avatar
                    name={user.name}
                    src={user.userPhotoURL ?? undefined}
                    color={user.profileBgColor}
                    size={30}
                  />
                  <Person>
                    <strong>{isMe ? "Você" : user.name}</strong>
                    <small>
                      {isMe ? "Clique para remover" : `@${user.user}`}
                    </small>
                  </Person>
                  <Emoji aria-label={`reagiu com ${emoji}`}>{emoji}</Emoji>
                </>
              );

              return isMe ? (
                <li key={user.id}>
                  <RemoveRow type="button" onClick={() => remove(emoji)}>
                    {content}
                  </RemoveRow>
                </li>
              ) : (
                <Row key={user.id}>{content}</Row>
              );
            })}
          </List>
        </Tooltip>
      )}
    </Wrapper>
  );
}
