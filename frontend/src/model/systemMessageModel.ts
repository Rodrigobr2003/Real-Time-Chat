import type { ChatPrivacy } from "./chatModel";

export interface ISystemActor {
  id: string;
  name: string;
}

export type ChatChange =
  | { field: "name"; from: string; to: string }
  | { field: "privacy"; to: ChatPrivacy }
  | { field: "userLimit"; from: number; to: number }
  | { field: "photo" }
  | { field: "color" }
  | { field: "password" };

export type SystemEvent =
  // Kick: remoção temporária, o usuário pode voltar depois de `expiresAt`
  | {
      type: "user:kicked";
      actor: ISystemActor;
      target: ISystemActor;
      expiresAt: string | null;
    }
  | { type: "user:blocked"; actor: ISystemActor; target: ISystemActor }
  | { type: "user:unblocked"; actor: ISystemActor; target: ISystemActor }
  | { type: "user:removed"; actor: ISystemActor; target: ISystemActor }
  | { type: "user:joined"; target: ISystemActor }
  | { type: "user:left"; target: ISystemActor }
  | { type: "admins:added"; actor: ISystemActor; targets: ISystemActor[] }
  | { type: "admin:removed"; actor: ISystemActor; target: ISystemActor }
  | { type: "chat:updated"; actor: ISystemActor; changes: ChatChange[] }
  | { type: "chat:deleted"; actor: ISystemActor; deletesAt: string | null };

export type SystemEventType = SystemEvent["type"];

export interface ISystemMessage {
  id: string;
  chatId: string;
  event: SystemEvent;
  createdAt: string;
}
