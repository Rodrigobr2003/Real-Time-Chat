import { api } from "./client";
import type { IMessage } from "../model/messageModel";

const messagesPath = (chatId: string) => `/chats/private/${chatId}/messages`;

export const listMessages = async (
  chatId: string,
  limit: number,
  before?: string,
) => {
  const { data } = await api.get<IMessage[]>(messagesPath(chatId), {
    params: { limit, before },
  });

  return data;
};

export const sendMessage = async (
  chatId: string,
  content: string,
  clientMessageId: string,
) => {
  const { data } = await api.post<IMessage>(messagesPath(chatId), {
    content,
    clientMessageId,
  });

  return data;
};

export const sendAttachmentMessage = async (
  chatId: string,
  files: File[],
  content: string,
  clientMessageId: string,
) => {
  const form = new FormData();

  form.append("clientMessageId", clientMessageId);
  if (content) form.append("content", content);
  files.forEach((file) => form.append("attachments", file, file.name));

  const { data } = await api.post<IMessage>(
    `${messagesPath(chatId)}/attachments`,
    form,
  );

  return data;
};

export const downloadAttachment = async (url: string) => {
  const { data } = await api.get<Blob>(url, { responseType: "blob" });

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

export const reactToMessage = async (
  chatId: string,
  messageId: string,
  emoji: string,
) => {
  const { data } = await api.patch<IMessage>(
    `${messagesPath(chatId)}/${messageId}/reactions`,
    { emoji },
  );

  return data;
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  const { data } = await api.delete<IMessage>(
    `${messagesPath(chatId)}/${messageId}`,
  );

  return data;
};
