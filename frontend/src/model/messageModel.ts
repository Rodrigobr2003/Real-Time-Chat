export const MESSAGE_MAX_LENGTH = 500;
export const MESSAGES_PAGE_SIZE = 30;

export interface IMessageOwner {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  profileBgColor: string;
}

export type MessageStatus = "sent" | "pending" | "failed";

export interface IMessage {
  id: string;
  chatId: string;
  owner: IMessageOwner;
  content: string;
  clientMessageId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface IChatMessage extends IMessage {
  status: MessageStatus;
}
