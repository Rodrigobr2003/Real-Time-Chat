import { verify } from "@node-rs/argon2";
import { Types } from "mongoose";
import { ConflictError } from "@errors/ConflictError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { ChatModel, type ChatPrivacy } from "@models/chatSchema";
import type {
  ChatConnectionInput,
  ChatDefaultInput,
  ChatList,
  ChatListFilters,
  ConnectedUser,
  ConnectedUserDoc,
  ListChatsInput,
  PublicChat,
  SaveChatInput,
  UpdateChatInput,
} from "@typings/chat";
import { toConnectedUser, toPublicChat } from "@utils/serviceResponse";

const USERS_COUNT = { $size: "$usersConnected" };

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toListQuery = ({
  privacy,
  minUsers,
  maxUsers,
  notFull,
  name,
}: ChatListFilters) => {
  const usersConditions = [
    ...(notFull ? [{ $lt: [USERS_COUNT, "$userLimit"] }] : []),
    ...(minUsers !== undefined ? [{ $gte: [USERS_COUNT, minUsers] }] : []),
    ...(maxUsers !== undefined ? [{ $lte: [USERS_COUNT, maxUsers] }] : []),
  ];

  return {
    deletedAt: null,
    ...(privacy && { privacy }),
    ...(name && { name: { $regex: escapeRegex(name), $options: "i" } }),
    ...(usersConditions.length > 0 && { $expr: { $and: usersConditions } }),
  };
};

export interface IChatRepository {
  save(data: SaveChatInput): Promise<PublicChat>;
  update(data: UpdateChatInput): Promise<PublicChat | null>;
  list(input: ListChatsInput): Promise<ChatList>;
  connect(input: ChatConnectionInput): Promise<boolean>;
  delete(chatId: string): Promise<boolean>;
  exists(chatId: string): Promise<boolean>;
  findPrivacy(chatId: string): Promise<ChatPrivacy | null>;
  disconnect(input: ChatDefaultInput): Promise<boolean>;
  listConnectedUsers(chatId: string): Promise<ConnectedUser[] | null>;
  verifyAdmin(input: ChatDefaultInput): Promise<boolean>;
  verifyOwner(input: ChatDefaultInput): Promise<boolean>;
  verifyConnectionStatus(input: ChatDefaultInput): Promise<boolean>;
}

export class MongoChatRepository implements IChatRepository {
  async save(data: SaveChatInput) {
    const doc = await ChatModel.create(data);

    return toPublicChat(doc);
  }

  async delete(chatId: string) {
    const { matchedCount } = await ChatModel.updateOne(
      { chatId, deletedAt: null },
      { $set: { deletedAt: new Date(), usersConnected: [] } },
    );

    return matchedCount > 0;
  }

  async exists(chatId: string) {
    return !!(await ChatModel.exists({ chatId, deletedAt: null }));
  }

  async findPrivacy(chatId: string) {
    const chat = await ChatModel.findOne({ chatId, deletedAt: null })
      .select("privacy")
      .lean();

    return chat?.privacy ?? null;
  }

  async update(data: UpdateChatInput) {
    const {
      chatId,
      chatPhoto,
      chatBgColor,
      name,
      password,
      privacy,
      userLimit,
    } = data;

    const doc = await ChatModel.findOneAndUpdate(
      {
        chatId,
        deletedAt: null,
        ...(userLimit !== undefined && {
          $expr: { $lte: [USERS_COUNT, userLimit] },
        }),
      },
      {
        chatPhoto,
        chatBgColor,
        name,
        password,
        privacy,
        userLimit,
      },
      { new: true },
    );

    if (
      !doc &&
      userLimit !== undefined &&
      (await ChatModel.exists({ chatId, deletedAt: null }))
    ) {
      throw new ConflictError(
        "Há mais usuários conectados do que o novo limite. Expulse alguns jogadores antes de diminuir o limite",
      );
    }

    return doc && toPublicChat(doc);
  }

  async list({ skip, limit, ...filters }: ListChatsInput) {
    const query = toListQuery(filters);

    const [docs, total] = await Promise.all([
      ChatModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatModel.countDocuments(query),
    ]);

    return { chats: docs.map(toPublicChat), total };
  }

  async listConnectedUsers(chatId: string) {
    const doc = await ChatModel.findOne({ chatId, deletedAt: null })
      .select("usersConnected")
      .populate<{ usersConnected: ConnectedUserDoc[] }>({
        path: "usersConnected",
        select: "name user userPhoto status profileBgColor",
        options: { sort: { name: 1 } },
      })
      .lean();

    if (!doc) return null;

    return doc.usersConnected.map(toConnectedUser);
  }

  async connect(input: ChatConnectionInput) {
    const userId = new Types.ObjectId(input.userId);

    const chat = await ChatModel.findOne({
      chatId: input.chatId,
      deletedAt: null,
    })
      .select("+password privacy usersConnected")
      .lean();

    if (!chat) return false;

    const isAlreadyConnected = chat.usersConnected.some((id) =>
      id.equals(userId),
    );

    if (chat.privacy === "private" && !isAlreadyConnected) {
      const passwordMatches =
        !!chat.password &&
        !!input.password &&
        (await verify(chat.password, input.password));

      if (!passwordMatches) throw new ForbiddenError("Senha incorreta");
    }

    const { matchedCount } = await ChatModel.updateOne(
      {
        chatId: input.chatId,
        deletedAt: null,
        $or: [
          { usersConnected: userId },
          { $expr: { $lt: [{ $size: "$usersConnected" }, "$userLimit"] } },
        ],
      },
      { $addToSet: { usersConnected: userId } },
    );

    return matchedCount > 0;
  }

  async disconnect(input: ChatDefaultInput) {
    const userId = new Types.ObjectId(input.userId);

    const { modifiedCount } = await ChatModel.updateOne(
      { chatId: input.chatId, usersConnected: userId },
      { $pull: { usersConnected: userId } },
    );

    return modifiedCount > 0;
  }

  async verifyAdmin(input: ChatDefaultInput) {
    const { chatId, userId } = input;

    const objectId = new Types.ObjectId(userId);

    const isAdmin = await ChatModel.findOne({
      chatId,
      chatAdmins: { $in: [objectId] },
    });

    return !!isAdmin;
  }

  async verifyOwner(input: ChatDefaultInput) {
    const { chatId, userId } = input;

    const objectId = new Types.ObjectId(userId);

    const isOwner = await ChatModel.findOne({
      chatId,
      chatOwner: objectId,
    });

    return !!isOwner;
  }

  async verifyConnectionStatus(input: ChatDefaultInput) {
    const { chatId, userId } = input;

    const objectId = new Types.ObjectId(userId);

    const isConnected = await ChatModel.findOne({
      chatId,
      usersConnected: { $in: [objectId] },
    });

    return !!isConnected;
  }
}
