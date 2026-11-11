import type {
  AttachmentCompression,
  AttachmentKind,
} from "@config/attachments";
import type { ChatDefaultInput, ConnectedUserDoc } from "./chat";
import type { RoomChange, RoomTarget } from "./realtime";

export type MessageKind = "user" | "system";

export type MessageType = "text" | "attachment";

export interface StoredAttachment {
  fileId: string;
  kind: AttachmentKind;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  storedSize: number;
  compression: AttachmentCompression;
}

export interface AttachmentDoc extends Omit<StoredAttachment, "fileId"> {
  _id: { toString(): string };
  fileId: { toString(): string };
}

export interface PublicAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  url: string;
}

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
  content?: string;
  clientMessageId?: string;
  attachments?: StoredAttachment[];
}

export interface AttachmentTargetInput extends MessageTargetInput {
  attachmentId: string;
}

export interface DeletedMessageResult {
  message: PublicMessage;
  fileIds: string[];
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

export interface MessageReactionInput extends MessageTargetInput {
  emoji: string;
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
  type?: MessageType | null;
  content?: string | null;
  attachments?: AttachmentDoc[] | null;
  system?: SystemEvent | null;
  reactions?: Record<string, string> | null;
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

export interface MessageReaction {
  emoji: string;
  user: MessageOwner;
}

interface BaseMessage {
  id: string;
  chatId: string;
  owner: MessageOwner;
  type: MessageType;
  content: string;
  attachments: PublicAttachment[];
  clientMessageId: string | null;
  reactions: MessageReaction[];
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
