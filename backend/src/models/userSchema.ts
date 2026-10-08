import { randomUUID } from "node:crypto";
import { Schema, model, type InferSchemaType } from "mongoose";

export const USER_STATUS = ["online", "absent", "busy", "invisible"] as const;
export const USER_BACKGROUND_COLOR = [
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#e84393",
  "#e17055",
  "#fdcb6e",
];

export type Status = (typeof USER_STATUS)[number];

export const USER_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const USER_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
export const USER_PHOTO_MIME_TYPE = "image/webp";

const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const USERNAME_REGEX = /^[a-z0-9._]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new Schema(
  {
    accountId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => randomUUID(),
    },
    name: {
      type: String,
      required: [true, "O nome é obrigatório"],
      trim: true,
      minLength: [3, "O nome deve ter no mínimo 3 caracteres"],
      maxLength: [60, "O nome deve ter no máximo 60 caracteres"],
    },
    user: {
      type: String,
      required: [true, "O nome de usuário é obrigatório"],
      unique: true,
      trim: true,
      lowercase: true,
      minLength: [3, "O nome de usuário deve ter no mínimo 3 caracteres"],
      maxLength: [30, "O nome de usuário deve ter no máximo 30 caracteres"],
      match: [
        USERNAME_REGEX,
        "Use apenas letras minúsculas, números, '.' e '_'",
      ],
    },
    email: {
      type: String,
      required: [true, "O e-mail é obrigatório"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, "E-mail inválido"],
    },
    passwordHash: {
      type: String,
      required: [true, "A senha é obrigatória"],
      select: false,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [280, "A descrição deve ter no máximo 280 caracteres"],
      default: "",
    },
    userPhoto: {
      type: Buffer,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: USER_STATUS,
        message: "Status inválido: {VALUE}",
      },
      default: "online",
    },
    profileBgColor: {
      type: String,
      trim: true,
      match: [
        HEX_COLOR_REGEX,
        "Cor inválida, use o formato hexadecimal (#RRGGBB)",
      ],
      default: USER_BACKGROUND_COLOR[0],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type IUser = InferSchemaType<typeof UserSchema>;

export const UserModel = model("User", UserSchema);
