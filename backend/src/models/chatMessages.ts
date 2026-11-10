import { Schema, model, type InferSchemaType } from "mongoose";
import {
  ATTACHMENT_COMPRESSIONS,
  ATTACHMENT_KINDS,
  ATTACHMENT_NAME_MAX_LENGTH,
  ATTACHMENTS_PER_MESSAGE,
} from "@config/attachments";

export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 500;
export const MESSAGE_LIST_DEFAULT_LIMIT = 30;
export const MESSAGE_LIST_MAX_LIMIT = 100;
export const MESSAGE_TYPES = ["text", "attachment"] as const;

const AttachmentSchema = new Schema({
  fileId: { type: Schema.Types.ObjectId, required: true },
  kind: { type: String, enum: ATTACHMENT_KINDS, required: true },
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: ATTACHMENT_NAME_MAX_LENGTH,
  },
  extension: { type: String, required: true, lowercase: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true, min: 1 },
  storedSize: { type: Number, required: true, min: 1 },
  compression: {
    type: String,
    enum: ATTACHMENT_COMPRESSIONS,
    default: "none",
  },
});

const ChatMessagesSchema = new Schema(
  {
    chatId: { type: String, required: true, immutable: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    kind: {
      type: String,
      enum: ["user", "system"],
      default: "user",
      immutable: true,
    },
    type: {
      type: String,
      enum: MESSAGE_TYPES,
      default: "text",
      immutable: true,
    },
    content: {
      type: String,
      required: function (this: { kind?: string; type?: string }) {
        return this.kind !== "system" && this.type !== "attachment";
      },
      trim: true,
      maxLength: MESSAGE_MAX_LENGTH,
      minLength: MESSAGE_MIN_LENGTH,
    },
    system: {
      type: Schema.Types.Mixed,
      default: null,
      immutable: true,
    },
    clientMessageId: {
      type: String,
      default: null,
      immutable: true,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
      validate: [
        {
          validator: (value: unknown[]) =>
            value.length <= ATTACHMENTS_PER_MESSAGE,
          message: `Envie no máximo ${ATTACHMENTS_PER_MESSAGE} anexos por mensagem`,
        },
        {
          validator: function (
            this: { type?: string; deletedAt?: Date | null },
            value: unknown[],
          ) {
            return (
              this.type !== "attachment" || !!this.deletedAt || value.length > 0
            );
          },
          message: "Mensagens de anexo precisam de pelo menos um arquivo",
        },
      ],
    },
    reactions: {
      type: Map,
      of: String,
      default: {},
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
ChatMessagesSchema.index({ owner: 1, type: 1, deletedAt: 1 });
ChatMessagesSchema.index(
  { owner: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  },
);

export type IChatMessages = InferSchemaType<typeof ChatMessagesSchema>;

export const ChatMessageModel = model("ChatMessages", ChatMessagesSchema);
