import { hash, Algorithm } from "@node-rs/argon2";
import { ConflictError } from "@errors/ConflictError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { IUserRepository } from "@repositories/UserRepository";
import type {
  CreateUserInput,
  PublicUser,
  UpdateUserInput,
} from "@typings/user";
import { compressUserPhoto } from "@utils/image";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new ConflictError("Email já cadastrado");
    }

    if (await this.userRepository.findByUsername(input.user)) {
      throw new ConflictError("Nome de usuário já cadastrado");
    }

    const passwordHash = await hash(input.password, {
      algorithm: Algorithm.Argon2id,
    });

    return this.userRepository.save({
      name: input.name,
      user: input.user,
      email: input.email,
      passwordHash,
    });
  }

  async updateUser(
    userId: string,
    input: UpdateUserInput,
  ): Promise<PublicUser> {
    if (input.email) {
      const found = await this.userRepository.findByEmail(input.email);
      if (found && found.id !== userId) {
        throw new ConflictError("Email já cadastrado");
      }
    }

    if (input.user) {
      const found = await this.userRepository.findByUsername(input.user);
      if (found && found.id !== userId) {
        throw new ConflictError("Nome de usuário já cadastrado");
      }
    }

    const updated = await this.userRepository.update(userId, {
      ...input,
      ...(input.userPhoto && {
        userPhoto: await compressUserPhoto(input.userPhoto),
      }),
    });

    if (!updated) throw new UnauthorizedError("Usuário não encontrado");

    return updated;
  }
}
