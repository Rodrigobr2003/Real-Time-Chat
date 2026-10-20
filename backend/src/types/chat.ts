import type { ChatPrivacy } from "@models/chatSchema";
import type { Status } from "@models/userSchema";

export type ChatDoc = {
  _id: { toString(): string };
  chatId: string;
  name: string;
  userLimit: number;
  privacy: ChatPrivacy;
  chatBgColor?: string | null;
  chatPhoto?: { toString(encoding: "base64"): string } | null;
  usersConnected: unknown[];
  createdAt: Date;
};

export interface CreateChatInput {
  name: string;
  userLimit: number;
  privacy?: ChatPrivacy;
  chatBgColor?: string;
  chatPhoto?: Buffer | null;
  password?: string | null;
}

export interface SaveChatInput extends CreateChatInput {
  chatOwner: string;
  chatAdmins: string[];
}

export interface UpdateChatInput extends Partial<CreateChatInput> {
  chatId: string;
}

export interface ChatListFilters {
  privacy?: ChatPrivacy;
  minUsers?: number;
  maxUsers?: number;
  notFull?: boolean;
  name?: string;
}

export interface ListChatsInput extends ChatListFilters {
  skip: number;
  limit: number;
}

export interface ChatDefaultInput {
  userId: string;
  chatId: string;
}

export interface ChatConnectionInput extends ChatDefaultInput {
  password?: string;
}

export interface ChatConnectionResult {
  isAdmin: boolean;
  isOwner: boolean;
}

export interface PublicChat {
  id: string;
  chatId: string;
  name: string;
  userLimit: number;
  privacy: ChatPrivacy;
  chatBgColor: string;
  chatPhotoURL: string | null;
  usersCount: number;
  createdAt: Date;
}

export interface ChatList {
  chats: PublicChat[];
  total: number;
}

export type ConnectedUserDoc = {
  _id: { toString(): string };
  name: string;
  user: string;
  userPhoto?: { toString(encoding: "base64"): string } | null;
  status?: Status | null;
  profileBgColor?: string | null;
};

export interface ConnectedUser {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  status: Status;
  profileBgColor: string;
}
