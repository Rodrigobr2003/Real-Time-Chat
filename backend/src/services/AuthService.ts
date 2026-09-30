import { verify } from "@node-rs/argon2";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { IAuthRepository } from "@repositories/AuthRepository";
import type { LoginInput } from "@typings/auth";
import type { PublicUser } from "@typings/user";
import { parseLoginIdentifier } from "@utils/loginIdentifier";

const INVALID_CREDENTIALS = "Usuário/e-mail ou senha inválidos";

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async login(input: LoginInput): Promise<PublicUser> {
    const identifier = parseLoginIdentifier(input.userOrEmail);
    const found = await this.authRepository.findByIdentifier(identifier);

    if (!found) throw new UnauthorizedError(INVALID_CREDENTIALS);

    const passwordMatches = await verify(found.passwordHash, input.password);

    if (!passwordMatches) throw new UnauthorizedError(INVALID_CREDENTIALS);

    return found.user;
  }
}
