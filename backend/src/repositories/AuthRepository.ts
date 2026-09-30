import { UserModel } from "@models/userSchema";
import type { AuthUser, LoginIdentifier } from "@typings/auth";
import { toPublicUser } from "@utils/serviceResponse";

export interface IAuthRepository {
  findByIdentifier(identifier: LoginIdentifier): Promise<AuthUser | null>;
}

export class AuthRepository implements IAuthRepository {
  async findByIdentifier(identifier: LoginIdentifier) {
    const doc = await UserModel.findOne({ [identifier.type]: identifier.value })
      .select("+passwordHash")
      .lean();

    if (!doc) return null;

    return { user: toPublicUser(doc), passwordHash: doc.passwordHash };
  }
}
