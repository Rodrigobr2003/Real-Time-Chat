import { api } from "./client";
import type { IMessage } from "../model/messageModel";

const messagesPath = (chatId: string) => `/chats/private/${chatId}/messages`;

export const listMessages = async (chatId: string) => {
  const { data } = await api.get<IMessage[]>(messagesPath(chatId));

  return data;
};

export const sendMessage = async (chatId: string, content: string) => {
  const { data } = await api.post<IMessage>(messagesPath(chatId), { content });

  return data;
};

export const editMessage = async (
  chatId: string,
  messageId: string,
  content: string,
) => {
  const { data } = await api.patch<IMessage>(
    `${messagesPath(chatId)}/${messageId}`,
    { content },
  );

  return data;
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  const { data } = await api.delete<IMessage>(
    `${messagesPath(chatId)}/${messageId}`,
  );

  return data;
};
