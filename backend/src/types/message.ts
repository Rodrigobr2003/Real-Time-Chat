import type { ChatDefaultInput, ConnectedUserDoc } from "./chat";

export interface MessageDefaultInput extends ChatDefaultInput {
  content: string;
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
  content: string;
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

export interface PublicMessage {
  id: string;
  chatId: string;
  owner: MessageOwner;
  content: string;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}
