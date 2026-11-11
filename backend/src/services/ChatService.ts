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
  ChatDemoteAdminInput,
  ChatPromoteAdminInput,
} from "@typings/chat";
import type {
  ChatPunishmentDoc,
  ChatPunishmentInterface,
  ModeratedUser,
  PunishmentResult,
} from "@typings/punishment";
import { compressPhoto } from "@utils/image";
import type { IMessageRepository } from "@repositories/MessageRepository";
import type {
  AttachmentTargetInput,
  CreateMessageResult,
  ListMessagesInput,
  MessageDefaultInput,
  MessageEditInput,
  MessageReactionInput,
  MessageTargetInput,
  PublicMessage,
  SystemEvent,
} from "@typings/message";
import type { RoomChange } from "@typings/realtime";
import type {
  AttachmentDownload,
  AttachmentService,
  UploadedFile,
} from "./AttachmentService";
import { IRealtimePublisher } from "./RealtimeHub";

const MAX_PUNISHMENT_DURATION_MS = PUNISHMENT_DURATIONS_MS.at(-1)!;

const isActiveTemporary = (punishment: ChatPunishmentDoc | null) =>
  punishment?.type === "temporary" &&
  !!punishment.expiresAt &&
  punishment.expiresAt > new Date();

const minutesUntil = (date: Date) =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 60_000));

const diffChat = (
  previous: PublicChat,
  updated: PublicChat,
  input: UpdateChatInput,
): RoomChange[] => [
  ...(updated.name !== previous.name
    ? [{ field: "name", from: previous.name, to: updated.name } as const]
    : []),
  ...(updated.privacy !== previous.privacy
    ? [{ field: "privacy", to: updated.privacy } as const]
    : []),
  ...(updated.userLimit !== previous.userLimit
    ? [
        {
          field: "userLimit",
          from: previous.userLimit,
          to: updated.userLimit,
        } as const,
      ]
    : []),
  ...(input.chatPhoto ? [{ field: "photo" } as const] : []),
  ...(updated.chatBgColor !== previous.chatBgColor
    ? [{ field: "color" } as const]
    : []),
  ...(input.password && previous.privacy === "private"
    ? [{ field: "password" } as const]
    : []),
];

export class ChatService {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly punishmentRepository: IPunishmentRepository,
    private readonly messageRespository: IMessageRepository,
    private readonly realtime: IRealtimePublisher,
    private readonly attachmentService: AttachmentService,
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

  private async announce(chatId: string, userId: string, system: SystemEvent) {
    const message = await this.messageRespository.createSystem({
      chatId,
      userId,
      system,
    });

    this.realtime.publish(chatId, { type: "message:created", message });
  }

  private async findConnectedTarget(input: ChatDefaultInput) {
    const users = await this.chatRepository.listConnectedUsers(input.chatId);
    const name = users?.find((user) => user.id === input.userId)?.name;

    return { id: input.userId, name: name ?? null };
  }

  private async isUserConnected(input: ChatDefaultInput) {
    if (!(await this.chatRepository.verifyConnectionStatus(input))) {
      throw new ForbiddenError("O usuário não está conectado à sala");
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
    const { chatId } = input;

    await this.isUserConnected({ userId, chatId });
    await this.assertIsAdmin({ userId, chatId });

    if (input.privacy === "public") {
      input.password = null;
    } else if (input.password) {
      input.password = await hash(input.password, {
        algorithm: Algorithm.Argon2id,
      });
    }

    const previous = await this.chatRepository.findPublic(chatId);

    const updated = await this.chatRepository.update({
      ...input,
      ...(input.chatPhoto && {
        chatPhoto: await compressPhoto(input.chatPhoto),
      }),
    });

    if (updated && previous) {
      const changes = diffChat(previous, updated, input);

      if (changes.length > 0) {
        this.realtime.publish(chatId, {
          type: "room:updated",
          chatId,
          chat: updated,
          changes,
          actorId: userId,
        });
        await this.announce(chatId, userId, { type: "chat:updated", changes });
      }
    }

    return updated;
  }

  async delete(input: ChatDefaultInput): Promise<boolean> {
    await this.isUserConnected(input);
    await this.assertIsOwner(input);

    const deleted = await this.chatRepository.delete(input.chatId);

    if (deleted) {
      await this.announce(input.chatId, input.userId, { type: "chat:deleted" });
      this.realtime.publish(input.chatId, {
        type: "room:deleted",
        chatId: input.chatId,
        actorId: input.userId,
      });
      this.realtime.closeRoom(input.chatId);
    }

    return deleted;
  }

  async listChats(input: ListChatsInput): Promise<ChatList> {
    const list = await this.chatRepository.list(input);

    // Última mensagem só das salas públicas; as privadas não expõem conteúdo
    const publicChatIds = list.chats
      .filter(({ privacy }) => privacy === "public")
      .map(({ chatId }) => chatId);

    const latest =
      await this.messageRespository.findLatestByChats(publicChatIds);
    const latestByChat = new Map(
      latest.map((message) => [message.chatId, message]),
    );

    return {
      ...list,
      chats: list.chats.map((chat) => ({
        ...chat,
        lastMessage: latestByChat.get(chat.chatId) ?? null,
      })),
    };
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
      throw new PunishedError("Você está bloqueado nesta sala", {
        type: "blocked",
        expiresAt: null,
      });
    }

    if (isActiveTemporary(punishment)) {
      const minutes = minutesUntil(punishment!.expiresAt!);
      throw new PunishedError(
        `Você foi expulso desta sala. Tente novamente em ${minutes} min`,
        { type: "temporary", expiresAt: punishment!.expiresAt! },
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
    await this.isUserConnected({ userId, chatId: input.chatId });
    await this.assertIsAdmin({ userId, chatId: input.chatId });

    const target = await this.findConnectedTarget(input);
    const disconnected = await this.chatRepository.disconnect(input);

    if (!disconnected) {
      throw new ConflictError("O usuário não está conectado nesta sala");
    }

    await this.announce(input.chatId, userId, { type: "user:removed", target });
    this.realtime.publish(input.chatId, {
      type: "room:remove",
      chatId: input.chatId,
      actorId: userId,
      target,
    });
    this.realtime.removeUser(input.chatId, input.userId);

    return true;
  }

  async punish(
    userId: string,
    input: ChatPunishmentInterface,
  ): Promise<PunishmentResult | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.isUserConnected({ userId, chatId: input.chatId });
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

    const target = await this.findConnectedTarget(input);

    const punishment = await this.punishmentRepository.apply({
      chatId: input.chatId,
      userId: input.userId,
      type: next.type,
      expiresAt,
    });

    await this.chatRepository.disconnect(input);

    await this.announce(
      input.chatId,
      userId,
      punishment.type === "blocked"
        ? { type: "user:blocked", target }
        : {
            type: "user:kicked",
            target,
            expiresAt: punishment.expiresAt ?? null,
          },
    );
    this.realtime.publish(
      input.chatId,
      punishment.type === "blocked"
        ? {
            type: "room:permanent-ban",
            chatId: input.chatId,
            actorId: userId,
            target,
          }
        : {
            type: "room:temporary-ban",
            chatId: input.chatId,
            actorId: userId,
            target,
            expiresAt: punishment.expiresAt ?? null,
          },
    );
    this.realtime.removeUser(input.chatId, input.userId);

    return {
      type: punishment.type,
      expiresAt: punishment.expiresAt ?? null,
      punishedCount: punishment.punishedCount,
    };
  }

  async unblock(userId: string, input: ChatDefaultInput): Promise<boolean> {
    await this.isUserConnected({ userId, chatId: input.chatId });
    await this.assertIsAdmin({ userId, chatId: input.chatId });

    const current = await this.punishmentRepository.find(input);

    if (current?.type !== "blocked") return false;

    const blocked = await this.punishmentRepository.listBlocked(input.chatId);
    const name = blocked.find((user) => user.id === input.userId)?.name;

    const unblocked = await this.punishmentRepository.reset(input);

    if (unblocked) {
      const target = { id: input.userId, name: name ?? null };

      this.realtime.publish(input.chatId, {
        type: "room:remove-ban",
        chatId: input.chatId,
        actorId: userId,
        target,
      });
      await this.announce(input.chatId, userId, {
        type: "user:unblocked",
        target,
      });
    }

    return unblocked;
  }

  private async assertCanChangeMessage(input: MessageTargetInput) {
    const message = await this.messageRespository.find(input);

    if (!message) return false;

    if (message.owner !== input.userId) {
      throw new ForbiddenError("Você só pode alterar suas próprias mensagens");
    }

    if (message.deletedAt) {
      throw new ConflictError("Esta mensagem foi apagada");
    }

    return true;
  }

  async listMessages(
    input: ListMessagesInput,
  ): Promise<PublicMessage[] | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.isUserConnected(input);

    return this.messageRespository.list(input);
  }

  private publishCreated(
    result: CreateMessageResult,
    chatId: string,
    privacy: string,
  ) {
    if (result.created) {
      this.realtime.publish(chatId, {
        type: "message:created",
        message: result.message,
      });

      if (privacy === "public") {
        this.realtime.publishToList({
          type: "room:lastMessage",
          chatId,
          message: result.message,
        });
      }
    }

    return result;
  }

  async sendMessage(
    input: MessageDefaultInput,
  ): Promise<CreateMessageResult | null> {
    const privacy = await this.chatRepository.findPrivacy(input.chatId);

    if (!privacy) return null;

    await this.isUserConnected(input);

    const result = await this.messageRespository.create({
      ...input,
      attachments: [],
    });

    return this.publishCreated(result, input.chatId, privacy);
  }

  async assertCanSend(input: ChatDefaultInput): Promise<boolean> {
    if (!(await this.chatRepository.exists(input.chatId))) return false;

    await this.isUserConnected(input);

    return true;
  }

  async sendAttachmentMessage(
    input: MessageDefaultInput,
    files: UploadedFile[],
  ): Promise<CreateMessageResult | null> {
    const privacy = await this.chatRepository.findPrivacy(input.chatId);

    if (!privacy) return null;

    await this.isUserConnected(input);

    const prepared = await this.attachmentService.prepare(files, input.userId);
    const attachments = await this.attachmentService.store(prepared, input);
    const fileIds = attachments.map(({ fileId }) => fileId);

    let result: CreateMessageResult;

    try {
      result = await this.messageRespository.create({ ...input, attachments });
    } catch (err) {
      await this.attachmentService.discard(fileIds);
      throw err;
    }

    if (!result.created) await this.attachmentService.discard(fileIds);

    return this.publishCreated(result, input.chatId, privacy);
  }

  async openAttachment(
    input: AttachmentTargetInput,
  ): Promise<AttachmentDownload | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.isUserConnected(input);

    const attachment = await this.messageRespository.findAttachment(input);

    return attachment && this.attachmentService.open(attachment);
  }

  async editMessage(input: MessageEditInput): Promise<PublicMessage | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.isUserConnected(input);

    if (!(await this.assertCanChangeMessage(input))) return null;

    const message = await this.messageRespository.update(input);

    if (!message) {
      throw new Error("Mensagem inexistente");
    }

    this.realtime.publish(input.chatId, { type: "message:updated", message });

    return message;
  }

  async deleteMessage(
    input: MessageTargetInput,
  ): Promise<PublicMessage | null> {
    if (!(await this.chatRepository.exists(input.chatId))) return null;

    await this.isUserConnected(input);

    if (!(await this.assertCanChangeMessage(input))) return null;

    const deleted = await this.messageRespository.delete(input);

    if (!deleted) {
      throw new Error("Mensagem inexistente");
    }

    const { message, fileIds } = deleted;

    await this.attachmentService.discard(fileIds);

    this.realtime.publish(input.chatId, { type: "message:deleted", message });

    return message;
  }

  async reactToMessage(
    input: MessageReactionInput,
  ): Promise<PublicMessage | null> {
    await this.isUserConnected(input);

    const message = await this.messageRespository.reactToMessage(input);

    if (!message) return null;

    this.realtime.publish(input.chatId, { type: "message:reacted", message });

    return message;
  }

  async promoteToAdmin(input: ChatPromoteAdminInput): Promise<boolean> {
    await this.isUserConnected(input);
    await this.assertIsAdmin(input);

    const wasAdmin = await this.chatRepository.verifyAdmin({
      userId: input.userIdToPromote,
      chatId: input.chatId,
    });

    const promoted = await this.chatRepository.promoteToAdmin(input);

    if (promoted && !wasAdmin) {
      this.realtime.publish(input.chatId, {
        type: "room:promote-admin",
        chatId: input.chatId,
        actorId: input.userId,
        userIdToPromote: input.userIdToPromote,
      });
      await this.announce(input.chatId, input.userId, {
        type: "admin:added",
        target: await this.findConnectedTarget({
          userId: input.userIdToPromote,
          chatId: input.chatId,
        }),
      });
    }

    return promoted;
  }

  async demoteAdmin(input: ChatDemoteAdminInput): Promise<boolean> {
    await this.isUserConnected(input);
    await this.assertIsAdmin(input);

    const isTargetOwner = await this.chatRepository.verifyOwner({
      userId: input.userIdToDemote,
      chatId: input.chatId,
    });

    if (isTargetOwner) {
      throw new ForbiddenError(
        "O criador da sala não pode deixar de ser administrador",
      );
    }

    const wasAdmin = await this.chatRepository.verifyAdmin({
      userId: input.userIdToDemote,
      chatId: input.chatId,
    });

    const demoted = await this.chatRepository.demoteAdmin(input);

    if (demoted && wasAdmin) {
      this.realtime.publish(input.chatId, {
        type: "room:demote-admin",
        chatId: input.chatId,
        actorId: input.userId,
        userIdToDemote: input.userIdToDemote,
      });
      await this.announce(input.chatId, input.userId, {
        type: "admin:removed",
        target: await this.findConnectedTarget({
          userId: input.userIdToDemote,
          chatId: input.chatId,
        }),
      });
    }

    return demoted;
  }
}
