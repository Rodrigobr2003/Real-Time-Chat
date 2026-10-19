import { api } from "./client";
import type {
  IChatList,
  IConnectChatDTO,
  IConnectedUser,
  ICreateChatDTO,
  IListChatsParams,
  IPublicChat,
  IPunishmentResult,
  IUpdateChatDTO,
  PunishmentType,
} from "../model/chatModel";

const PRIVATE_CHAT_DEFAULT_PATH = "/chats/private";

const toCreatePayload = ({ chatPhoto, password, ...rest }: ICreateChatDTO) => {
  const fields = rest.privacy === "private" ? { ...rest, password } : rest;

  if (!chatPhoto) return fields;

  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, String(value));
  }

  formData.append("chatPhoto", chatPhoto);

  return formData;
};

export const createChat = async (createDTO: ICreateChatDTO) => {
  const { data } = await api.post<IPublicChat>(
    `${PRIVATE_CHAT_DEFAULT_PATH}/create`,
    toCreatePayload(createDTO),
  );

  return data;
};

export const connectChat = async ({ chatId, password }: IConnectChatDTO) => {
  await api.patch(`${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}/connect`, {
    password,
  });
};

export const updateChat = async (
  chatId: string,
  { chatPhoto, ...fields }: IUpdateChatDTO,
) => {
  let payload: IUpdateChatDTO | FormData = fields;

  if (chatPhoto) {
    payload = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      payload.append(key, String(value));
    }

    payload.append("chatPhoto", chatPhoto);
  }

  const { data } = await api.patch<IPublicChat>(
    `${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}`,
    payload,
  );

  return data;
};

export const deleteChat = async (chatId: string) => {
  await api.delete(`${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}`);
};

export const disconnectChat = async (chatId: string) => {
  await api.patch(`${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}/disconnect`);
};

export const listBlockedUsers = async (chatId: string) => {
  const { data } = await api.get<IConnectedUser[]>(
    `${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}/blocked-users`,
  );

  return data;
};

const chatUserPath = (chatId: string, userId: string) =>
  `${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}/users/${userId}`;

export const kickUser = async (chatId: string, userId: string) => {
  await api.patch(`${chatUserPath(chatId, userId)}/kick`);
};

export const punishUser = async (
  chatId: string,
  userId: string,
  type: PunishmentType,
) => {
  const { data } = await api.patch<IPunishmentResult>(
    `${chatUserPath(chatId, userId)}/punish`,
    { type },
  );

  return data;
};

export const unblockUser = async (chatId: string, userId: string) => {
  await api.patch(`${chatUserPath(chatId, userId)}/unblock`);
};

export const listConnectedUsers = async (chatId: string) => {
  const { data } = await api.get<IConnectedUser[]>(
    `${PRIVATE_CHAT_DEFAULT_PATH}/${chatId}/connected-users`,
  );

  return data;
};

export const listChats = async (params: IListChatsParams) => {
  const { data } = await api.get<IChatList>(
    `${PRIVATE_CHAT_DEFAULT_PATH}/list`,
    { params },
  );

  return data;
};
