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
import type {
  MessageDoc,
  MessageOwner,
  MessageOwnerDoc,
  PublicMessage,
} from "@typings/message";
import type { PublicUser, UserDoc } from "@typings/user";

type StoredPhoto = { toString(encoding: "base64"): string } | null | undefined;

const toPhotoDataURL = (photo: StoredPhoto, mimeType: string) =>
  photo ? `data:${mimeType};base64,${photo.toString("base64")}` : null;

export const toPublicUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
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

export const toMessageOwner = (doc: MessageOwnerDoc): MessageOwner => ({
  id: doc._id.toString(),
  name: doc.name,
  user: doc.user,
  userPhotoURL: toPhotoDataURL(doc.userPhoto, USER_PHOTO_MIME_TYPE),
  profileBgColor: doc.profileBgColor ?? USER_BACKGROUND_COLOR[0],
});

export const toAttachmentURL = (
  chatId: string,
  messageId: string,
  attachmentId: string,
) => `/chats/private/${chatId}/messages/${messageId}/attachments/${attachmentId}`;

export const toPublicMessage = (
  doc: MessageDoc,
  reactors: Map<string, MessageOwner> = new Map(),
): PublicMessage => {
  const id = doc._id.toString();
  const base = {
    id,
    chatId: doc.chatId,
    owner: toMessageOwner(doc.owner),
    type: doc.type ?? "text",
    content: doc.deletedAt ? "" : (doc.content ?? ""),
    attachments: doc.deletedAt
      ? []
      : (doc.attachments ?? []).map((attachment) => ({
          id: attachment._id.toString(),
          kind: attachment.kind,
          name: attachment.name,
          extension: attachment.extension,
          mimeType: attachment.mimeType,
          size: attachment.size,
          url: toAttachmentURL(doc.chatId, id, attachment._id.toString()),
        })),
    clientMessageId: doc.clientMessageId ?? null,
    reactions: Object.entries(doc.reactions ?? {}).flatMap(([id, emoji]) => {
      const user = reactors.get(id);

      return user ? [{ emoji, user }] : [];
    }),
    editedAt: doc.editedAt ?? null,
    deletedAt: doc.deletedAt ?? null,
    createdAt: doc.createdAt,
  };

  return doc.kind === "system" && doc.system
    ? { ...base, kind: "system", system: doc.system }
    : { ...base, kind: "user", system: null };
};
