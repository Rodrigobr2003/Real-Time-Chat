import { CalendarDays, LogOut, Mail, Monitor, Pencil } from "lucide-react";
import { useState } from "react";
import styled from "styled-components";
import {
  STATUS_OPTIONS,
  type Profile,
  type UserStatus,
} from "../../mocks/profile";
import { getStatusColor } from "../../styles/status";
import { Avatar } from "../ui/Avatar";
import { Button, IconButton } from "../ui/Button";
import { EditProfileModal } from "./EditProfileModal";

type ProfileTabProps = {
  profile: Profile;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Cover = styled.div<{ $color: string }>`
  flex-shrink: 0;
  height: 96px;
  border-radius: ${({ theme }) => theme.radius.md};
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.18),
      transparent 50%
    ),
    linear-gradient(135deg, ${({ $color }) => $color}, #00b894);
`;

const Identity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: -64px;
  padding-inline: 12px;
`;

const AvatarRing = styled.div`
  align-self: flex-start;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surface};
`;

const NameRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h2 {
    font-size: 20px;
    line-height: 1.2;
  }

  span {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const EditButton = styled(IconButton)`
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const StatusPill = styled.span<{ $status: UserStatus }>`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-size: 12px;
  font-weight: 600;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $status, theme }) => getStatusColor(theme, $status)};
  }
`;

const Bio = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  strong {
    font-size: 18px;
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const InfoList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    font-size: 14px;
    min-width: 0;
  }

  li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  div {
    min-width: 0;
  }
`;

const LogoutButton = styled(Button)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.danger};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.danger};
    background: rgba(231, 76, 60, 0.1);
  }
`;

export function ProfileTab({
  profile,
  onLogout,
  isLoggingOut = false,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const statusLabel = STATUS_OPTIONS.find(
    (option) => option.value === profile.status,
  )?.label;

  return (
    <Wrapper>
      <Cover $color={profile.accentColor} />

      <Identity>
        <AvatarRing>
          <Avatar
            size={88}
            src={profile.photoURL ?? undefined}
            status={profile.status}
            color={profile.accentColor}
          />
        </AvatarRing>

        <NameRow>
          <div>
            <h2>{profile.name}</h2>
            <span>@{profile.username}</span>
          </div>
          <EditButton
            onClick={() => setIsEditing(true)}
            aria-label="Editar perfil"
            title="Editar perfil"
          >
            <Pencil size={16} />
          </EditButton>
        </NameRow>

        <StatusPill $status={profile.status}>{statusLabel}</StatusPill>

        <Bio>{profile.bio || "Nenhuma descrição adicionada."}</Bio>
      </Identity>

      <Stats>
        <Stat>
          <strong>{profile.stats.rooms}</strong>
          <span>Salas criadas</span>
        </Stat>
        <Stat>
          <strong>{profile.stats.messages.toLocaleString("pt-BR")}</strong>
          <span>Mensagens</span>
        </Stat>
        <Stat>
          <strong>{profile.stats.connections}</strong>
          <span>Conexões</span>
        </Stat>
      </Stats>

      <InfoList>
        <li>
          <Mail size={18} />
          <div>
            <small>E-mail</small>
            <p>{profile.email}</p>
          </div>
        </li>
        <li>
          <Monitor size={18} />
          <div>
            <small>Máquina</small>
            <p>{profile.machine}</p>
          </div>
        </li>
        <li>
          <CalendarDays size={18} />
          <div>
            <small>Membro desde</small>
            <p>{profile.memberSince}</p>
          </div>
        </li>
      </InfoList>

      <LogoutButton
        $variant="ghost"
        $fullWidth
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        <LogOut size={18} />
        {isLoggingOut ? "Saindo..." : "Sair da conta"}
      </LogoutButton>

      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
    </Wrapper>
  );
}
