import { UserModel } from "@models/userSchema";
import { ConflictError } from "@errors/ConflictError";
import type { NewUser, PublicUser, UpdateUserInput } from "@typings/user";
import { toPublicUser } from "@utils/serviceResponse";

const DUPLICATE_KEY_CODE = 11000;

const isDuplicateKeyError = (err: unknown) =>
  (err as { code?: number }).code === DUPLICATE_KEY_CODE;

export interface IUserRepository {
  findByEmail(email: string): Promise<PublicUser | null>;
  findByUsername(user: string): Promise<PublicUser | null>;
  save(data: NewUser): Promise<PublicUser>;
  update(id: string, data: UpdateUserInput): Promise<PublicUser | null>;
}

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();

    return doc ? toPublicUser(doc) : null;
  }

  async findByUsername(user: string) {
    const doc = await UserModel.findOne({ user: user.toLowerCase() }).lean();

    return doc ? toPublicUser(doc) : null;
  }

  async save(data: NewUser) {
    try {
      const doc = await UserModel.create(data);

      return toPublicUser(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError("Email ou nome de usuário já cadastrado");
      }
      throw err;
    }
  }

  async update(id: string, data: UpdateUserInput) {
    try {
      const doc = await UserModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true },
      ).lean();

      return doc ? toPublicUser(doc) : null;
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError("Email ou nome de usuário já cadastrado");
      }
      throw err;
    }
  }
}
