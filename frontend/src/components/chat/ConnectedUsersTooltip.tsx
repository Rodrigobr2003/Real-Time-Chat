import type { ReactNode } from "react";
import styled from "styled-components";
import type { IConnectedUser } from "../../model/chatModel";
import { Avatar } from "../ui/Avatar";

type ConnectedUsersTooltipProps = {
  users: IConnectedUser[];
  isLoading: boolean;
  children: ReactNode;
};

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  min-width: 220px;
  max-width: min(280px, calc(100vw - 32px));
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition:
    opacity 0.15s,
    transform 0.15s,
    visibility 0.15s;
`;

const Trigger = styled.span`
  position: relative;
  cursor: default;
  border-radius: ${({ theme }) => theme.radius.sm};

  &:hover > ${Tooltip}, &:focus-visible > ${Tooltip} {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: ${({ theme }) => theme.radius.sm};

  div:last-child {
    min-width: 0;
  }

  strong,
  small {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text};
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Empty = styled.p`
  margin: 0;
  padding: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function ConnectedUsersTooltip({
  users,
  isLoading,
  children,
}: ConnectedUsersTooltipProps) {
  function renderContent() {
    if (isLoading) return <Empty>Carregando...</Empty>;
    if (users.length === 0) return <Empty>Ninguém na sala</Empty>;

    return (
      <List>
        {users.map((user) => (
          <Row key={user.id}>
            <Avatar
              name={user.name}
              src={user.userPhotoURL ?? undefined}
              color={user.profileBgColor}
              status={user.status}
              size={32}
            />
            <div>
              <strong>{user.name}</strong>
              <small>@{user.user}</small>
            </div>
          </Row>
        ))}
      </List>
    );
  }

  return (
    <Trigger tabIndex={0}>
      {children}
      <Tooltip role="tooltip">{renderContent()}</Tooltip>
    </Trigger>
  );
}
