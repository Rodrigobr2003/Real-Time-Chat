import { RefreshModel } from "@models/refreshToken";

export interface IRefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  revoke(id: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor() {}

  public async create(userId: string, tokenHash: string, expiresAt: Date) {
    if (typeof userId !== "string") {
      throw new Error("userId must be a string");
    }

    if (typeof tokenHash !== "string") {
      throw new Error("tokenHash must be a string");
    }

    if (expiresAt instanceof Date === false) {
      throw new Error("expiresAt must be an instance of Date");
    }

    await RefreshModel.create({ userId, tokenHash, expiresAt });

    return;
  }

  public async findByHash(
    tokenHash: string,
  ): Promise<StoredRefreshToken | null> {
    const doc = await RefreshModel.findOne({ tokenHash }).lean().exec();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt ?? null,
    };
  }

  async revoke(id: string) {
    if (typeof id !== "string") {
      throw new Error("id must be a string");
    }

    const result = await RefreshModel.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    return result.modifiedCount === 1;
  }

  async revokeAllForUser(userId: string) {
    await RefreshModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
}
