import { UserModel } from "@models/userSchema";
import { ConflictError } from "@errors/ConflictError";
import type { NewUser, PublicUser } from "@typings/user";

// Contrato: o service depende disto, não do Mongoose.
export interface IUserRepository {
  findByEmail(email: string): Promise<PublicUser | null>;
  findByUsername(user: string): Promise<PublicUser | null>;
  save(data: NewUser): Promise<PublicUser>;
}

type UserDoc = {
  _id: { toString(): string };
  accountId: string;
  name: string;
  user: string;
  email: string;
  createdAt: Date;
};

const toPublicUser = (doc: UserDoc): PublicUser => ({
  id: doc._id.toString(),
  accountId: doc.accountId,
  name: doc.name,
  user: doc.user,
  email: doc.email,
  createdAt: doc.createdAt,
});

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
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictError("Email ou nome de usuário já cadastrado");
      }
      throw err;
    }
  }
}
