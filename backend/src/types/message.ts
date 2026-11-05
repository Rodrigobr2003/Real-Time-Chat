import type { ChatDefaultInput, ConnectedUserDoc } from "./chat";
import type { RoomChange, RoomTarget } from "./realtime";

export type MessageKind = "user" | "system";

export type SystemEvent =
  | { type: "chat:updated"; changes: RoomChange[] }
  | { type: "chat:deleted" }
  | {
      type:
        | "admin:added"
        | "admin:removed"
        | "user:removed"
        | "user:blocked"
        | "user:unblocked";
      target: RoomTarget;
    }
  | { type: "user:kicked"; target: RoomTarget; expiresAt: Date | null };

export interface MessageDefaultInput extends ChatDefaultInput {
  content: string;
  clientMessageId?: string;
}

export interface CreateMessageResult {
  message: PublicMessage;
  created: boolean;
}

export interface SystemMessageInput extends ChatDefaultInput {
  system: SystemEvent;
}

export interface MessageTargetInput extends ChatDefaultInput {
  messageId: string;
}

export interface MessageEditInput extends MessageTargetInput {
  content: string;
}

export interface ListMessagesInput extends ChatDefaultInput {
  before?: Date;
  limit: number;
}

export type MessageOwnerDoc = Omit<ConnectedUserDoc, "status">;

export type MessageDoc = {
  _id: { toString(): string };
  chatId: string;
  owner: MessageOwnerDoc;
  kind?: MessageKind | null;
  content?: string | null;
  system?: SystemEvent | null;
  clientMessageId?: string | null;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
};

export interface MessageOwner {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  profileBgColor: string;
}

interface BaseMessage {
  id: string;
  chatId: string;
  owner: MessageOwner;
  content: string;
  clientMessageId: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface UserMessage extends BaseMessage {
  kind: "user";
  system: null;
}

export interface SystemMessage extends BaseMessage {
  kind: "system";
  system: SystemEvent;
}

export type PublicMessage = UserMessage | SystemMessage;
