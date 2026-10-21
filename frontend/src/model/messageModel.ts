export const MESSAGE_MAX_LENGTH = 500;
export const MESSAGES_PAGE_SIZE = 30;

export interface IMessageOwner {
  id: string;
  name: string;
  user: string;
  userPhotoURL: string | null;
  profileBgColor: string;
}

export interface IMessage {
  id: string;
  chatId: string;
  owner: IMessageOwner;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}
