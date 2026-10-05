import { Schema, model, type InferSchemaType } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// O Mongo apaga sozinho os documentos depois do expiresAt.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IRefreshToken = InferSchemaType<typeof RefreshTokenSchema>;
export const RefreshModel = model("RefreshToken", RefreshTokenSchema);
