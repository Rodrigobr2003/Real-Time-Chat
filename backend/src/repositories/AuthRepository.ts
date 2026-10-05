import { UserModel } from "@models/userSchema";
import type { AuthUser, LoginIdentifier } from "@typings/auth";
import type { PublicUser } from "@typings/user";
import { toPublicUser } from "@utils/serviceResponse";

export interface IAuthRepository {
  findByIdentifier(identifier: LoginIdentifier): Promise<AuthUser | null>;
  findById(id: string): Promise<PublicUser | null>;
}

export class AuthRepository implements IAuthRepository {
  async findById(id: string) {
    const doc = await UserModel.findById(id).lean();

    return doc ? toPublicUser(doc) : null;
  }

  async findByIdentifier(identifier: LoginIdentifier) {
    const doc = await UserModel.findOne({ [identifier.type]: identifier.value })
      .select("+passwordHash")
      .lean();

    if (!doc) return null;

    return { user: toPublicUser(doc), passwordHash: doc.passwordHash };
  }
}
