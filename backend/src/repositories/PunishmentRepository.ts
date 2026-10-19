import { Types } from "mongoose";
import { ChatPunishmentModel } from "@models/chatPunishmentSchema";
import type { ChatDefaultInput, ConnectedUserDoc } from "@typings/chat";
import type {
  ApplyPunishmentInput,
  ChatPunishmentDoc,
  ModeratedUser,
} from "@typings/punishment";
import { toConnectedUser } from "@utils/serviceResponse";

const toQuery = ({ chatId, accountId }: ChatDefaultInput) => ({
  chatId,
  user: new Types.ObjectId(accountId),
});

export interface IPunishmentRepository {
  find(input: ChatDefaultInput): Promise<ChatPunishmentDoc | null>;
  apply(input: ApplyPunishmentInput): Promise<ChatPunishmentDoc>;
  reset(input: ChatDefaultInput): Promise<boolean>;
  listBlocked(chatId: string): Promise<ModeratedUser[]>;
  countByUsers(chatId: string, userIds: string[]): Promise<Map<string, number>>;
}

export class MongoPunishmentRepository implements IPunishmentRepository {
  async find(input: ChatDefaultInput) {
    return ChatPunishmentModel.findOne(toQuery(input)).lean();
  }

  async apply({ type, expiresAt, ...input }: ApplyPunishmentInput) {
    const doc = await ChatPunishmentModel.findOneAndUpdate(
      toQuery(input),
      {
        $set: { type, expiresAt, lastPunishment: new Date() },
        $inc: { punishedCount: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return doc!;
  }

  async reset(input: ChatDefaultInput) {
    const { matchedCount } = await ChatPunishmentModel.updateOne(
      toQuery(input),
      { $set: { type: "temporary", punishedCount: 0, expiresAt: null } },
    );

    return matchedCount > 0;
  }

  async listBlocked(chatId: string) {
    const docs = await ChatPunishmentModel.find({ chatId, type: "blocked" })
      .populate<{ user: ConnectedUserDoc | null }>({
        path: "user",
        select: "name user userPhoto status profileBgColor",
      })
      .sort({ lastPunishment: -1 })
      .lean();

    return docs.flatMap(({ user, punishedCount }) =>
      user ? [{ ...toConnectedUser(user), punishedCount }] : [],
    );
  }

  async countByUsers(chatId: string, userIds: string[]) {
    const docs = await ChatPunishmentModel.find({
      chatId,
      user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
    })
      .select("user punishedCount")
      .lean();

    return new Map(docs.map((doc) => [doc.user.toString(), doc.punishedCount]));
  }
}
