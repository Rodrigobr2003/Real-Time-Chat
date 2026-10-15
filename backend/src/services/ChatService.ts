import { hash, Algorithm } from "@node-rs/argon2";
import type { IChatRepository } from "@repositories/ChatRepository";
import type {
  ChatList,
  ChatConnectInput,
  ConnectedUser,
  CreateChatInput,
  ListChatsInput,
  PublicChat,
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

  async listChats(input: ListChatsInput): Promise<ChatList> {
    return this.chatRepository.list(input);
  }

  async listConnectedUsers(chatId: string): Promise<ConnectedUser[] | null> {
    return this.chatRepository.listConnectedUsers(chatId);
  }

  async connectUser(input: ChatConnectInput): Promise<boolean> {
    return this.chatRepository.connect(input);
  }
}
