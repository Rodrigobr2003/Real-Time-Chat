import { User } from "lucide-react";
import styled from "styled-components";
import type { UserStatus } from "../../mocks/profile";
import { getStatusColor } from "../../styles/status";

type AvatarProps = {
  /** Sem nome, mostra a foto padrão (silhueta). */
  name?: string;
  src?: string;
  status?: UserStatus;
  size?: number;
  color?: string;
};

const Wrapper = styled.div<{ $size: number; $color: string }>`
  position: relative;
  flex-shrink: 0;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(135deg, ${({ $color }) => $color}, #00b894);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: ${({ $size }) => $size * 0.4}px;
  color: #fff;
  text-transform: uppercase;

  img {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
  }
`;

const StatusDot = styled.span<{ $status: UserStatus }>`
  position: absolute;
  right: 2%;
  bottom: 2%;
  width: 28%;
  height: 28%;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 2px solid ${({ theme }) => theme.colors.surface};
  background: ${({ $status, theme }) => getStatusColor(theme, $status)};
`;

export function Avatar({ name, src, status, size = 40, color = "#6c5ce7" }: AvatarProps) {
  return (
    <Wrapper $size={size} $color={color}>
      {src ? (
        <img src={src} alt={name ?? "Foto de perfil"} />
      ) : name ? (
        name.charAt(0)
      ) : (
        <User size={size * 0.55} strokeWidth={1.75} />
      )}
      {status && <StatusDot $status={status} />}
    </Wrapper>
  );
}
