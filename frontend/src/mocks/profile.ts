import { PROFILE_BG_COLORS, type UserStatus } from "../model/userModel";

export type { UserStatus };

export type Profile = {
  name: string;
  username: string;
  bio: string;
  email: string;
  status: UserStatus;
  accentColor: string;
  photoURL: string | null;
  machine: string;
  memberSince: string;
  stats: {
    rooms: number;
    messages: number;
    connections: number;
  };
};

export const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "absent", label: "Ausente" },
  { value: "busy", label: "Ocupado" },
  { value: "invisible", label: "Invisível" },
];

export const ACCENT_COLORS = PROFILE_BG_COLORS;

export const mockProfile: Profile = {
  name: "Máquina A",
  username: "maquina.a",
  bio: "Estação de trabalho principal. Disponível para conversas e troca de arquivos durante o expediente.",
  email: "maquina.a@rede.local",
  status: "online",
  accentColor: "#6c5ce7",
  photoURL: null,
  machine: "DESKTOP-01 · 192.168.0.12",
  memberSince: "Setembro de 2026",
  stats: {
    rooms: 3,
    messages: 1284,
    connections: 17,
  },
};
