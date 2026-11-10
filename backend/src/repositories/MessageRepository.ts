import { ConflictError } from "@errors/ConflictError";
import { ChatMessageModel } from "@models/chatMessages";
import { Types } from "mongoose";
import type {
  AttachmentDoc,
  AttachmentTargetInput,
  CreateMessageResult,
  DeletedMessageResult,
  ListMessagesInput,
  MessageDefaultInput,
  MessageDoc,
  MessageOwnerDoc,
  MessageEditInput,
  MessageReactionInput,
  MessageTargetInput,
  PublicMessage,
  SystemMessageInput,
} from "@typings/message";
import { UserModel } from "@models/userSchema";
import { toMessageOwner, toPublicMessage } from "@utils/serviceResponse";

const OWNER_FIELDS = "name user userPhoto profileBgColor";
const DUPLICATE_KEY_ERROR = 11000;

const isDuplicateKeyError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  err.code === DUPLICATE_KEY_ERROR;

const userMessageFilter = (
  messageId: string,
  chatId: string,
  userId: string,
) => ({
  _id: messageId,
  chatId,
  owner: userId,
  kind: { $ne: "system" as const },
  deletedAt: null,
});

export interface IMessageRepository {
  create(input: MessageDefaultInput): Promise<CreateMessageResult>;
  createSystem(input: SystemMessageInput): Promise<PublicMessage>;
  find(
    input: Omit<MessageTargetInput, "userId">,
  ): Promise<{ owner: string; deletedAt: Date | null } | null>;
  update(input: MessageEditInput): Promise<PublicMessage | null>;
  delete(input: MessageTargetInput): Promise<DeletedMessageResult | null>;
  findAttachment(input: AttachmentTargetInput): Promise<AttachmentDoc | null>;
  sumStoredSizeByOwner(userId: string): Promise<number>;
  list(input: ListMessagesInput): Promise<PublicMessage[]>;
  findLatestByChats(chatIds: string[]): Promise<PublicMessage[]>;
  reactToMessage(input: MessageReactionInput): Promise<PublicMessage | null>;
}

export class MessageRepository implements IMessageRepository {
  private async toPublicWithReactors(docs: MessageDoc[]) {
    const ids = [
      ...new Set(docs.flatMap((doc) => Object.keys(doc.reactions ?? {}))),
    ];

    const users = ids.length
      ? await UserModel.find({ _id: { $in: ids } })
          .select(OWNER_FIELDS)
          .lean<MessageOwnerDoc[]>()
      : [];

    const reactors = new Map(
      users.map((user) => [user._id.toString(), toMessageOwner(user)]),
    );

    return docs.map((doc) => toPublicMessage(doc, reactors));
  }

  private async findPublic(messageId: string) {
    const doc = await ChatMessageModel.findById(messageId)
      .populate<{ owner: MessageDoc["owner"] }>("owner", OWNER_FIELDS)
      .lean<MessageDoc>();

    if (!doc) return null;

    const [message] = await this.toPublicWithReactors([doc]);

    return message;
  }

  async create({
    chatId,
    userId,
    content,
    clientMessageId,
    attachments = [],
  }: MessageDefaultInput) {
    try {
      const doc = await ChatMessageModel.create({
        chatId,
        owner: userId,
        type: attachments.length ? "attachment" : "text",
        content: content || undefined,
        attachments,
        clientMessageId,
      });

      return {
        message: (await this.findPublic(doc._id.toString()))!,
        created: true,
      };
    } catch (err) {
      if (!clientMessageId || !isDuplicateKeyError(err)) throw err;

      const existing = await ChatMessageModel.findOne({
        owner: userId,
        clientMessageId,
      })
        .populate<{ owner: MessageDoc["owner"] }>("owner", OWNER_FIELDS)
        .lean<MessageDoc>();

      if (!existing || existing.chatId !== chatId) {
        throw new ConflictError("Identificador de mensagem já utilizado");
      }

      const [message] = await this.toPublicWithReactors([existing]);

      return { message, created: false };
    }
  }

  async createSystem({ chatId, userId, system }: SystemMessageInput) {
    const doc = await ChatMessageModel.create({
      chatId,
      owner: userId,
      kind: "system",
      system,
    });

    return (await this.findPublic(doc._id.toString()))!;
  }

  async find({ chatId, messageId }: Omit<MessageTargetInput, "userId">) {
    const doc = await ChatMessageModel.findOne({
      _id: messageId,
      chatId,
      kind: { $ne: "system" as const },
    })
      .select("owner deletedAt")
      .lean();

    return (
      doc && { owner: doc.owner.toString(), deletedAt: doc.deletedAt ?? null }
    );
  }

  async update({ chatId, userId, messageId, content }: MessageEditInput) {
    const { matchedCount } = await ChatMessageModel.updateOne(
      { ...userMessageFilter(messageId, chatId, userId) },
      { $set: { content, editedAt: new Date() } },
      { runValidators: true },
    );

    return matchedCount > 0 ? this.findPublic(messageId) : null;
  }

  async delete({ chatId, userId, messageId }: MessageTargetInput) {
    const previous = await ChatMessageModel.findOneAndUpdate(
      { ...userMessageFilter(messageId, chatId, userId) },
      { $set: { deletedAt: new Date(), attachments: [] } },
      { projection: { "attachments.fileId": 1 }, returnDocument: "before" },
    ).lean();

    if (!previous) return null;

    const message = await this.findPublic(messageId);

    return (
      message && {
        message,
        fileIds: (previous.attachments ?? []).map(({ fileId }) =>
          fileId.toString(),
        ),
      }
    );
  }

  async findAttachment({
    chatId,
    messageId,
    attachmentId,
  }: AttachmentTargetInput) {
    const doc = await ChatMessageModel.findOne(
      {
        _id: messageId,
        chatId,
        deletedAt: null,
        "attachments._id": attachmentId,
      },
      { "attachments.$": 1 },
    ).lean<{ attachments: AttachmentDoc[] }>();

    return doc?.attachments[0] ?? null;
  }

  async sumStoredSizeByOwner(userId: string) {
    const [result] = await ChatMessageModel.aggregate<{ total: number }>([
      {
        $match: {
          owner: new Types.ObjectId(userId),
          type: "attachment",
          deletedAt: null,
        },
      },
      { $unwind: "$attachments" },
      { $group: { _id: null, total: { $sum: "$attachments.storedSize" } } },
    ]);

    return result?.total ?? 0;
  }

  async reactToMessage({
    chatId,
    messageId,
    userId,
    emoji,
  }: MessageReactionInput) {
    const filter = {
      _id: messageId,
      chatId,
      kind: { $ne: "system" as const },
      deletedAt: null,
    };

    const doc = await ChatMessageModel.findOne(filter)
      .select("reactions")
      .lean();

    if (!doc) return null;

    const field = `reactions.${userId}`;
    const isSameReaction = doc.reactions?.[userId] === emoji;

    await ChatMessageModel.updateOne(
      filter,
      isSameReaction
        ? { $unset: { [field]: "" } }
        : { $set: { [field]: emoji } },
    );

    return this.findPublic(messageId);
  }

  async list({ chatId, before, limit }: ListMessagesInput) {
    const docs = await ChatMessageModel.find({
      chatId,
      ...(before && { createdAt: { $lt: before } }),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ owner: MessageDoc["owner"] }>("owner", OWNER_FIELDS)
      .lean<MessageDoc[]>();

    return this.toPublicWithReactors(docs.reverse());
  }

  async findLatestByChats(chatIds: string[]) {
    if (chatIds.length === 0) return [];

    const latest = await ChatMessageModel.aggregate([
      {
        $match: {
          chatId: { $in: chatIds },
          deletedAt: null,
          kind: { $ne: "system" as const },
        },
      },
      { $sort: { chatId: 1, createdAt: -1 } },
      { $group: { _id: "$chatId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    const docs = await ChatMessageModel.populate<MessageDoc>(latest, {
      path: "owner",
      select: OWNER_FIELDS,
    });

    return docs.map((doc) => toPublicMessage(doc));
  }
}
