import { hash, Algorithm } from "@node-rs/argon2";
import { ConflictError } from "@errors/ConflictError";
import { PunishedError } from "@errors/PunishedError";
import { getNextPunishment } from "@models/chatPunishmentSchema";
import type { IChatRepository } from "@repositories/ChatRepository";
import type { IPunishmentRepository } from "@repositories/PunishmentRepository";
import type {
  ChatList,
  ChatDefaultInput,
  CreateChatInput,
  ListChatsInput,
  PublicChat,
  UpdateChatInput,
  ChatConnectionInput,
} from "@typings/chat";
import type {
  ChatPunishmentDoc,
  ChatPunishmentInterface,
  ModeratedUser,
  PunishmentResult,
} from "@typings/punishment";
import { compressPhoto } from "@utils/image";

const isActiveTemporary = (punishment: ChatPunishmentDoc | null) =>
  punishment?.type === "temporary" &&
  !!punishment.expiresAt &&
  punishment.expiresAt > new Date();

const minutesUntil = (date: Date) =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));

export class ChatService {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly punishmentRepository: IPunishmentRepository,
  ) {}

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

  async listConnectedUsers(chatId: string): Promise<ModeratedUser[] | null> {
    const users = await this.chatRepository.listConnectedUsers(chatId);

    if (!users) return null;

    const counts = await this.punishmentRepository.countByUsers(
      chatId,
      users.map((user) => user.id),
    );

    return users.map((user) => ({
      ...user,
      punishedCount: counts.get(user.id) ?? 0,
    }));
  }

  async listBlockedUsers(chatId: string): Promise<ModeratedUser[] | null> {
    if (!(await this.chatRepository.exists(chatId))) return null;

    return this.punishmentRepository.listBlocked(chatId);
  }

  async connectUser(input: ChatConnectionInput): Promise<boolean> {
    const punishment = await this.punishmentRepository.find(input);

    if (punishment?.type === "blocked") {
      throw new PunishedError("Você está bloqueado nesta sala");
    }

    if (isActiveTemporary(punishment)) {
      const minutes = minutesUntil(punishment!.expiresAt!);
      throw new PunishedError(
        `Você foi expulso desta sala. Tente novamente em ${minutes} min`,
      );
    }

    return this.chatRepository.connect(input);
  }

  async disconnectUser(input: ChatDefaultInput): Promise<boolean> {
    return this.chatRepository.disconnect(input);
  }

  async kickUser(input: ChatDefaultInput): Promise<boolean> {
    const disconnected = await this.chatRepository.disconnect(input);

    if (!disconnected) {
      throw new ConflictError("O usuário não está conectado nesta sala");
    }

    return true;
  }

  async punish(
    input: ChatPunishmentInterface,
  ): Promise<PunishmentResult | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    const current = await this.punishmentRepository.find(input);

    if (current?.type === "blocked") {
      throw new ConflictError("Este usuário já está bloqueado");
    }

    if (isActiveTemporary(current)) {
      throw new ConflictError("Este usuário já está cumprindo uma punição");
    }

    const next =
      input.punishmentType === "blocked"
        ? ({ type: "blocked" } as const)
        : getNextPunishment(current?.punishedCount ?? 0);
    const expiresAt =
      next.type === "temporary" && next.durationMs !== undefined
        ? new Date(Date.now() + next.durationMs)
        : null;

    const punishment = await this.punishmentRepository.apply({
      chatId: input.chatId,
      accountId: input.accountId,
      type: next.type,
      expiresAt,
    });

    await this.chatRepository.disconnect(input);

    return {
      type: punishment.type,
      expiresAt: punishment.expiresAt ?? null,
      punishedCount: punishment.punishedCount,
    };
  }

  async unblock(input: ChatDefaultInput): Promise<boolean> {
    const current = await this.punishmentRepository.find(input);

    if (current?.type !== "blocked") return false;

    return this.punishmentRepository.reset(input);
  }
}
