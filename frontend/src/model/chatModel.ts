import type { UserStatus } from "./userModel";

export const CHAT_PRIVACY = ["public", "private"] as const;
export const CHAT_BG_COLORS = [
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#e84393",
  "#e17055",
  "#fdcb6e",
] as const;

export const CHAT_NAME_MIN_LENGTH = 3;
export const CHAT_NAME_MAX_LENGTH = 80;
export const CHAT_MIN_USERS = 2;
export const CHAT_MAX_USERS = 50;
export const CHAT_PASSWORD_MIN_LENGTH = 4;
export const CHAT_PASSWORD_MAX_LENGTH = 128;

export const CHAT_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const CHAT_PHOTO_MAX_SIZE = 5 * 1024 * 1024;

export type ChatPrivacy = (typeof CHAT_PRIVACY)[number];

export interface ICreateChatDTO {
  name: string;
  userLimit: number;
  privacy: ChatPrivacy;
  chatBgColor: string;
  chatPhoto: File | null;
  password: string;
}

export interface IUpdateChatDTO {
  name?: string;
  userLimit?: number;
  privacy?: ChatPrivacy;
  chatBgColor?: string;
  chatPhoto?: File;
  password?: string;
}

export interface IConnectChatDTO {
  chatId: string;
  password?: string;
}

export interface IChatConnection {
  isAdmin: boolean;
  isOwner: boolean;
}

export interface IConnectedUser {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  status: UserStatus;
  profileBgColor: string;
  punishedCount?: number;
}

export type PunishmentType = "temporary" | "blocked";

export interface IPunishmentResult {
  type: PunishmentType;
  expiresAt: string | null;
  punishedCount: number;
}

export interface IPublicChat {
  id: string;
  chatId: string;
  name: string;
  userLimit: number;
  privacy: ChatPrivacy;
  chatBgColor: string;
  chatPhotoURL: string | null;
  usersCount: number;
  createdAt: string;
}

export interface IListChatsParams {
  skip: number;
  limit: number;
  privacy?: ChatPrivacy;
  minUsers?: number;
  maxUsers?: number;
  notFull?: boolean;
  name?: string;
}

export interface IChatList {
  chats: IPublicChat[];
  total: number;
}

export type VisibilityFilter = "all" | ChatPrivacy;
export type PeopleFilter = "any" | "1-2" | "3-5" | "6-10" | "10+";

export interface IChatFilters {
  search: string;
  visibility: VisibilityFilter;
  people: PeopleFilter;
  onlyAvailable: boolean;
}

export const INITIAL_CHAT_FILTERS: IChatFilters = {
  search: "",
  visibility: "all",
  people: "any",
  onlyAvailable: false,
};
