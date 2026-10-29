import { ConflictError } from "@errors/ConflictError";
import { ChatMessageModel } from "@models/chatMessages";
import type {
  CreateMessageResult,
  ListMessagesInput,
  MessageDefaultInput,
  MessageDoc,
  MessageEditInput,
  MessageTargetInput,
  PublicMessage,
} from "@typings/message";
import { toPublicMessage } from "@utils/serviceResponse";

const OWNER_FIELDS = "name user userPhoto profileBgColor";
const DUPLICATE_KEY_ERROR = 11000;

const isDuplicateKeyError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  err.code === DUPLICATE_KEY_ERROR;

export interface IMessageRepository {
  create(input: MessageDefaultInput): Promise<CreateMessageResult>;
  find(
    input: Omit<MessageTargetInput, "userId">,
  ): Promise<{ owner: string; deletedAt: Date | null } | null>;
  update(input: MessageEditInput): Promise<PublicMessage | null>;
  delete(input: MessageTargetInput): Promise<PublicMessage | null>;
  list(input: ListMessagesInput): Promise<PublicMessage[]>;
}

export class MessageRepository implements IMessageRepository {
  private async findPublic(messageId: string) {
    const doc = await ChatMessageModel.findById(messageId)
      .populate<{ owner: MessageDoc["owner"] }>("owner", OWNER_FIELDS)
      .lean<MessageDoc>();

    return doc && toPublicMessage(doc);
  }

  async create({
    chatId,
    userId,
    content,
    clientMessageId,
  }: MessageDefaultInput) {
    try {
      const doc = await ChatMessageModel.create({
        chatId,
        owner: userId,
        content,
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

      return { message: toPublicMessage(existing), created: false };
    }
  }

  async find({ chatId, messageId }: Omit<MessageTargetInput, "userId">) {
    const doc = await ChatMessageModel.findOne({ _id: messageId, chatId })
      .select("owner deletedAt")
      .lean();

    return (
      doc && { owner: doc.owner.toString(), deletedAt: doc.deletedAt ?? null }
    );
  }

  async update({ chatId, userId, messageId, content }: MessageEditInput) {
    const { matchedCount } = await ChatMessageModel.updateOne(
      { _id: messageId, chatId, owner: userId, deletedAt: null },
      { $set: { content, editedAt: new Date() } },
      { runValidators: true },
    );

    return matchedCount > 0 ? this.findPublic(messageId) : null;
  }

  async delete({ chatId, userId, messageId }: MessageTargetInput) {
    const { matchedCount } = await ChatMessageModel.updateOne(
      { _id: messageId, chatId, owner: userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );

    return matchedCount > 0 ? this.findPublic(messageId) : null;
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

    return docs.reverse().map(toPublicMessage);
  }
}
