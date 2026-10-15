import { api } from "./client";
import type {
  IChatList,
  IConnectChatDTO,
  IConnectedUser,
  ICreateChatDTO,
  IListChatsParams,
  IPublicChat,
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
