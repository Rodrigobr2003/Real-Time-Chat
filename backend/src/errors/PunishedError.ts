import type { PunishmentType } from "@models/chatPunishmentSchema";

export interface PunishmentInfo {
  type: PunishmentType;
  expiresAt: Date | null;
}

export class PunishedError extends Error {
  constructor(
    message: string,
    readonly punishment: PunishmentInfo,
  ) {
    super(message);
    this.name = "PunishedError";
  }
}
