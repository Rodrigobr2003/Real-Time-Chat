import { hash, Algorithm } from "@node-rs/argon2";
import { ConflictError } from "@errors/ConflictError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { PunishedError } from "@errors/PunishedError";
import {
  getNextPunishment,
  PUNISHMENT_DURATIONS_MS,
} from "@models/chatPunishmentSchema";
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
  ChatConnectionResult,
} from "@typings/chat";
import type {
  ChatPunishmentDoc,
  ChatPunishmentInterface,
  ModeratedUser,
  PunishmentResult,
} from "@typings/punishment";
import { compressPhoto } from "@utils/image";

const MAX_PUNISHMENT_DURATION_MS = PUNISHMENT_DURATIONS_MS.at(-1)!;

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

  private async assertIsAdmin(input: ChatDefaultInput) {
    if (!(await this.chatRepository.verifyAdmin(input))) {
      throw new ForbiddenError("Apenas administradores podem fazer isso");
    }
  }

  private async assertIsOwner(input: ChatDefaultInput) {
    if (!(await this.chatRepository.verifyOwner(input))) {
      throw new ForbiddenError("Apenas o dono da sala pode fazer isso");
    }
  }

  async createChat(
    userId: string,
    input: CreateChatInput,
  ): Promise<PublicChat> {
    if (input.password && input.privacy === "private") {
      input.password = await hash(input.password, {
        algorithm: Algorithm.Argon2id,
      });
    }

    return this.chatRepository.save({
      ...input,
      chatOwner: userId,
      chatAdmins: [userId],
      ...(input.chatPhoto && {
        chatPhoto: await compressPhoto(input.chatPhoto),
      }),
    });
  }

  async updateChat(
    userId: string,
    input: UpdateChatInput,
  ): Promise<PublicChat | null> {
    await this.assertIsAdmin({ userId, chatId: input.chatId });

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

  async delete(input: ChatDefaultInput): Promise<boolean> {
    await this.assertIsOwner(input);

    return this.chatRepository.delete(input.chatId);
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

  async listBlockedUsers(
    userId: string,
    chatId: string,
  ): Promise<ModeratedUser[] | null> {
    if (!(await this.chatRepository.exists(chatId))) return null;

    await this.assertIsAdmin({ userId, chatId });

    return this.punishmentRepository.listBlocked(chatId);
  }

  async connectUser(
    input: ChatConnectionInput,
  ): Promise<ChatConnectionResult | null> {
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

    if (!(await this.chatRepository.connect(input))) return null;

    const [isAdmin, isOwner] = await Promise.all([
      this.chatRepository.verifyAdmin(input),
      this.chatRepository.verifyOwner(input),
    ]);

    return { isAdmin, isOwner };
  }

  async disconnectUser(input: ChatDefaultInput): Promise<boolean> {
    return this.chatRepository.disconnect(input);
  }

  async kickUser(userId: string, input: ChatDefaultInput): Promise<boolean> {
    await this.assertIsAdmin({ userId, chatId: input.chatId });

    const disconnected = await this.chatRepository.disconnect(input);

    if (!disconnected) {
      throw new ConflictError("O usuário não está conectado nesta sala");
    }

    return true;
  }

  async punish(
    userId: string,
    input: ChatPunishmentInterface,
  ): Promise<PunishmentResult | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.assertIsAdmin({ userId, chatId: input.chatId });

    const isTargetOwner = await this.chatRepository.verifyOwner(input);

    if (isTargetOwner && input.punishmentType === "blocked") {
      throw new ForbiddenError("O dono da sala não pode ser bloqueado");
    }

    const current = await this.punishmentRepository.find(input);

    if (current?.type === "blocked") {
      throw new ConflictError("Este usuário já está bloqueado");
    }

    if (isActiveTemporary(current)) {
      throw new ConflictError("Este usuário já está cumprindo uma punição");
    }

    let next =
      input.punishmentType === "blocked"
        ? ({ type: "blocked" } as const)
        : getNextPunishment(current?.punishedCount ?? 0);

    if (isTargetOwner && next.type === "blocked") {
      next = { type: "temporary", durationMs: MAX_PUNISHMENT_DURATION_MS };
    }
    const expiresAt =
      next.type === "temporary" && next.durationMs !== undefined
        ? new Date(Date.now() + next.durationMs)
        : null;

    const punishment = await this.punishmentRepository.apply({
      chatId: input.chatId,
      userId: input.userId,
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

  async unblock(userId: string, input: ChatDefaultInput): Promise<boolean> {
    await this.assertIsAdmin({ userId, chatId: input.chatId });

    const current = await this.punishmentRepository.find(input);

    if (current?.type !== "blocked") return false;

    return this.punishmentRepository.reset(input);
  }
}
