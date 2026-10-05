import { hash, Algorithm } from "@node-rs/argon2";
import { ConflictError } from "@errors/ConflictError";
import type { IUserRepository } from "@repositories/UserRepository";
import type { CreateUserInput, PublicUser } from "@typings/user";

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
}
