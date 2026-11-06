import { ConflictError } from "@errors/ConflictError";
import { UserModel } from "@models/userSchema";
import type { AuthUser, LoginIdentifier } from "@typings/auth";
import type { PublicUser } from "@typings/user";
import { toPublicUser } from "@utils/serviceResponse";

const DUPLICATE_KEY_CODE = 11000;

const isDuplicateKeyError = (err: unknown) =>
  (err as { code?: number }).code === DUPLICATE_KEY_CODE;

export interface GoogleUserInput {
  googleId: string;
  email: string;
  name: string;
  user: string;
  userPhoto: Buffer | null;
}

export interface IAuthRepository {
  findByIdentifier(identifier: LoginIdentifier): Promise<AuthUser | null>;
  findById(id: string): Promise<PublicUser | null>;
  findByGoogleId(googleId: string): Promise<PublicUser | null>;
  linkGoogleByEmail(
    email: string,
    googleId: string,
  ): Promise<PublicUser | null>;
  createFromGoogle(input: GoogleUserInput): Promise<PublicUser>;
  usernameExists(user: string): Promise<boolean>;
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

  async findByGoogleId(googleId: string) {
    const doc = await UserModel.findOne({ googleId }).lean();
    return doc ? toPublicUser(doc) : null;
  }

  async linkGoogleByEmail(email: string, googleId: string) {
    const doc = await UserModel.findOneAndUpdate(
      { email, googleId: { $exists: false } },
      { $set: { googleId } },
      { new: true },
    ).lean();

    return doc ? toPublicUser(doc) : null;
  }

  async createFromGoogle(input: GoogleUserInput) {
    try {
      const doc = await UserModel.create(input);

      return toPublicUser(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError(
          "Este e-mail já está vinculado a outra conta Google",
        );
      }
      throw err;
    }
  }

  async usernameExists(user: string) {
    return !!(await UserModel.exists({ user }));
  }
}
