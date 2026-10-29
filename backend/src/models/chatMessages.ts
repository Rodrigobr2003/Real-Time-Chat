import { Schema, model, type InferSchemaType } from "mongoose";

export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 500;
export const MESSAGE_LIST_DEFAULT_LIMIT = 30;
export const MESSAGE_LIST_MAX_LIMIT = 100;

const ChatMessagesSchema = new Schema(
  {
    chatId: { type: String, required: true, immutable: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: MESSAGE_MAX_LENGTH,
      minLength: MESSAGE_MIN_LENGTH,
    },
    clientMessageId: {
      type: String,
      default: null,
      immutable: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ChatMessagesSchema.index({ chatId: 1, createdAt: -1 });
ChatMessagesSchema.index(
  { owner: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  },
);

export type IChatMessages = InferSchemaType<typeof ChatMessagesSchema>;

export const ChatMessageModel = model("ChatMessages", ChatMessagesSchema);
