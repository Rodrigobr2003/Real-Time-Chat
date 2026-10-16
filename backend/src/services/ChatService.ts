import { hash, Algorithm } from "@node-rs/argon2";
import type { IChatRepository } from "@repositories/ChatRepository";
import type {
  ChatList,
  ChatConnectionInput,
  ConnectedUser,
  CreateChatInput,
  ListChatsInput,
  PublicChat,
  UpdateChatInput,
} from "@typings/chat";
import { compressPhoto } from "@utils/image";

export class ChatService {
  constructor(private readonly chatRepository: IChatRepository) {}

  async createChat(input: CreateChatInput): Promise<PublicChat> {
    if (input.password && input.privacy === "private") {
      input.password = await hash(input.password, {
        algorithm: Algorithm.Argon2id,
      });
    }

    return this.chatRepository.save({
      ...input,
      ...(input.chatPhoto && {
        chatPhoto: await compressPhoto(input.chatPhoto),
      }),
    });
  }

  async updateChat(input: UpdateChatInput): Promise<PublicChat | null> {
    if (input.privacy === "public") {
      input.password = null;
    } else if (input.password) {
      input.password = await hash(input.password, {
        algorithm: Algorithm.Argon2id,
      });
    }

    return this.chatRepository.update({
      ...input,
      ...(input.chatPhoto && {
        chatPhoto: await compressPhoto(input.chatPhoto),
      }),
    });
  }

  async delete(chatId: string): Promise<boolean> {
    return this.chatRepository.delete(chatId);
  }

  async listChats(input: ListChatsInput): Promise<ChatList> {
    return this.chatRepository.list(input);
  }

  async listConnectedUsers(chatId: string): Promise<ConnectedUser[] | null> {
    return this.chatRepository.listConnectedUsers(chatId);
  }

  async connectUser(input: ChatConnectionInput): Promise<boolean> {
    return this.chatRepository.connect(input);
  }

  async disconnectUser(input: ChatConnectionInput): Promise<boolean> {
    return this.chatRepository.disconnect(input);
  }
}
