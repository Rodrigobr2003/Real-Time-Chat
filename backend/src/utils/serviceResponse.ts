import {
  CHAT_BACKGROUND_COLOR,
  CHAT_PHOTO_MIME_TYPE,
} from "@models/chatSchema";
import {
  USER_BACKGROUND_COLOR,
  USER_PHOTO_MIME_TYPE,
} from "@models/userSchema";
import type {
  ChatDoc,
  ConnectedUser,
  ConnectedUserDoc,
  PublicChat,
} from "@typings/chat";
import type { PublicUser, UserDoc } from "@typings/user";

type StoredPhoto = { toString(encoding: "base64"): string } | null | undefined;

const toPhotoDataURL = (photo: StoredPhoto, mimeType: string) =>
  photo ? `data:${mimeType};base64,${photo.toString("base64")}` : null;

export const toPublicUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
  accountId: doc.accountId,
  name: doc.name,
  user: doc.user,
  email: doc.email,
  description: doc.description ?? "",
  userPhotoURL: toPhotoDataURL(doc.userPhoto, USER_PHOTO_MIME_TYPE),
  status: doc.status ?? "online",
  profileBgColor: doc.profileBgColor ?? USER_BACKGROUND_COLOR[0],
  createdAt: doc.createdAt,
});

export const toConnectedUser = (doc: ConnectedUserDoc): ConnectedUser => ({
  id: doc._id.toString(),
  name: doc.name,
  user: doc.user,
  userPhotoURL: toPhotoDataURL(doc.userPhoto, USER_PHOTO_MIME_TYPE),
  status: doc.status ?? "online",
  profileBgColor: doc.profileBgColor ?? USER_BACKGROUND_COLOR[0],
});

export const toPublicChat = (doc: ChatDoc): PublicChat => ({
  id: doc._id.toString(),
  chatId: doc.chatId,
  name: doc.name,
  userLimit: doc.userLimit,
  privacy: doc.privacy,
  chatBgColor: doc.chatBgColor ?? CHAT_BACKGROUND_COLOR[0],
  chatPhotoURL: toPhotoDataURL(doc.chatPhoto, CHAT_PHOTO_MIME_TYPE),
  usersCount: doc.usersConnected.length,
  createdAt: doc.createdAt,
});
