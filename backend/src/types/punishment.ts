import type { PunishmentType } from "@models/chatPunishmentSchema";
import type { ChatDefaultInput, ConnectedUser } from "./chat";

export interface ChatPunishmentInterface extends ChatDefaultInput {
  punishmentType?: PunishmentType;
}

export interface ApplyPunishmentInput extends ChatDefaultInput {
  type: PunishmentType;
  expiresAt: Date | null;
}

export interface ChatPunishmentDoc {
  chatId: string;
  user: { toString(): string };
  type: PunishmentType;
  punishedCount: number;
  expiresAt?: Date | null;
  lastPunishment?: Date | null;
}

export interface PunishmentResult {
  type: PunishmentType;
  expiresAt: Date | null;
  punishedCount: number;
}

export interface ModeratedUser extends ConnectedUser {
  punishedCount: number;
}
