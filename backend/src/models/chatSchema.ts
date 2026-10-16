import { randomUUID } from "node:crypto";
import { Schema, Types, model, type InferSchemaType } from "mongoose";

export const CHAT_PRIVACY = ["public", "private"] as const;
export const CHAT_BACKGROUND_COLOR = [
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#e84393",
  "#e17055",
  "#fdcb6e",
];

export type ChatPrivacy = (typeof CHAT_PRIVACY)[number];

export const CHAT_NAME_MIN_LENGTH = 3;
export const CHAT_NAME_MAX_LENGTH = 80;
export const CHAT_MIN_USERS = 2;
export const CHAT_MAX_USERS = 50;
export const CHAT_PASSWORD_MIN_LENGTH = 4;
export const CHAT_PASSWORD_MAX_LENGTH = 128;

export const CHAT_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const CHAT_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
export const CHAT_PHOTO_MIME_TYPE = "image/webp";

export const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const ChatSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => randomUUID(),
    },
    name: {
      type: String,
      required: [true, "O nome da sala é obrigatório"],
      trim: true,
      minLength: [
        CHAT_NAME_MIN_LENGTH,
        `O nome da sala deve ter no mínimo ${CHAT_NAME_MIN_LENGTH} caracteres`,
      ],
      maxLength: [
        CHAT_NAME_MAX_LENGTH,
        `O nome da sala deve ter no máximo ${CHAT_NAME_MAX_LENGTH} caracteres`,
      ],
    },
    userLimit: {
      type: Number,
      required: [true, "O limite de pessoas é obrigatório"],
      min: [
        CHAT_MIN_USERS,
        `A sala deve permitir no mínimo ${CHAT_MIN_USERS} pessoas`,
      ],
      max: [
        CHAT_MAX_USERS,
        `A sala deve permitir no máximo ${CHAT_MAX_USERS} pessoas`,
      ],
    },
    privacy: {
      type: String,
      required: true,
      enum: {
        values: CHAT_PRIVACY,
        message: "Privacidade inválida: {VALUE}",
      },
      default: "public",
    },
    chatBgColor: {
      type: String,
      trim: true,
      match: [
        HEX_COLOR_REGEX,
        "Cor inválida, use o formato hexadecimal (#RRGGBB)",
      ],
      default: CHAT_BACKGROUND_COLOR[0],
    },
    chatPhoto: {
      type: Buffer,
      default: null,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    usersConnected: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      validate: {
        validator: function (
          this: { userLimit: number },
          users: Types.ObjectId[],
        ) {
          return users.length <= this.userLimit;
        },
        message: "A sala atingiu o limite de usuários",
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export type IChat = InferSchemaType<typeof ChatSchema>;

export const ChatModel = model("Chat", ChatSchema);
