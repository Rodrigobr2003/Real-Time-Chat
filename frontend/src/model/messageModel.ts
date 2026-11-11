import type { AttachmentKind } from "../utils/attachments";
import type { RoomTarget } from "./realtimeModel";
import type { ChatChange } from "./systemMessageModel";

export const MESSAGE_MAX_LENGTH = 500;
export const MESSAGES_PAGE_SIZE = 30;

export interface IMessageOwner {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  profileBgColor: string;
}

export type MessageStatus = "sent" | "pending" | "failed";

export type MessageKind = "user" | "system";

export type MessageType = "text" | "attachment";

export type IMessageSystemEvent =
  | { type: "chat:updated"; changes: ChatChange[] }
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
  | { type: "user:kicked"; target: RoomTarget; expiresAt: string | null };

export interface IMessageReaction {
  emoji: string;
  user: IMessageOwner;
}

export interface IMessageAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  url: string | null;
}

interface IBaseMessage {
  id: string;
  chatId: string;
  owner: IMessageOwner;
  type: MessageType;
  content: string;
  clientMessageId: string | null;
  reactions: IMessageReaction[];
  attachments: IMessageAttachment[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface IUserMessage extends IBaseMessage {
  kind: "user";
  system: null;
}

export interface ISystemChatMessage extends IBaseMessage {
  kind: "system";
  system: IMessageSystemEvent;
}

export type IMessage = IUserMessage | ISystemChatMessage;

export type IChatMessage = IMessage & {
  status: MessageStatus;
  error?: string;
};
