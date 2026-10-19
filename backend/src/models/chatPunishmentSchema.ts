import { Schema, model, type InferSchemaType } from "mongoose";

export const PUNISHMENT_TYPES = ["temporary", "blocked"] as const;

export type PunishmentType = (typeof PUNISHMENT_TYPES)[number];

export const PUNISHMENT_DURATIONS_MS = [
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
] as const;

interface NextPunishment {
  type: PunishmentType;
  durationMs?: number;
}

export const getNextPunishment = (punishedCount: number): NextPunishment => {
  const durationMs: number | undefined = PUNISHMENT_DURATIONS_MS[punishedCount];

  return durationMs !== undefined
    ? { type: "temporary" as const, durationMs }
    : { type: "blocked" as const };
};

const ChatPunishmentSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: PUNISHMENT_TYPES,
        message: "Tipo de punição inválido: {VALUE}",
      },
    },
    punishedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastPunishment: {
      type: Date,
      default: () => new Date(),
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

ChatPunishmentSchema.index({ chatId: 1, user: 1 }, { unique: true });

export type IChatPunishment = InferSchemaType<typeof ChatPunishmentSchema>;

export const ChatPunishmentModel = model(
  "ChatPunishment",
  ChatPunishmentSchema,
);
