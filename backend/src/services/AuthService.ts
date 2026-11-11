import { verify } from "@node-rs/argon2";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { IAuthRepository } from "@repositories/AuthRepository";
import type { AuthSession, LoginInput } from "@typings/auth";
import type { PublicUser } from "@typings/user";
import { parseLoginIdentifier } from "@utils/loginIdentifier";
import { IRefreshTokenRepository } from "@repositories/RefreshTokenRepository";
import { signToken } from "@utils/jwt";
import { verifyGoogleCredential, type GoogleProfile } from "@utils/googleAuth";
import { downloadPhoto } from "@utils/image";
import { usernameFromEmail } from "@utils/username";
import {
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "@utils/refreshToken";

const INVALID_CREDENTIALS = "Usuário/e-mail ou senha inválidos";

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async login(input: LoginInput): Promise<{ user: PublicUser } & AuthSession> {
    const identifier = parseLoginIdentifier(input.userOrEmail);
    const found = await this.authRepository.findByIdentifier(identifier);

    if (!found?.passwordHash) throw new UnauthorizedError(INVALID_CREDENTIALS);

    const passwordMatches = await verify(found.passwordHash, input.password);

    if (!passwordMatches) throw new UnauthorizedError(INVALID_CREDENTIALS);

    const session = await this.createSession(found.user.id);

    return { user: found.user, ...session };
  }

  private async createSession(userId: string): Promise<AuthSession> {
    const accessToken = signToken(userId);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

    await this.refreshTokenRepository.create(
      userId,
      hashToken(refreshToken),
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token não fornecido");
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepository.findByHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedError("Refresh token inválido");
    }

    if (stored.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedError("Refresh token revogado");
    }

    if (stored.expiresAt < new Date()) {
      await this.refreshTokenRepository.revoke(stored.id);
      throw new UnauthorizedError("Refresh token expirado");
    }

    const revokedNow = await this.refreshTokenRepository.revoke(stored.id);

    if (!revokedNow) {
      await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedError("Refresh token revogado");
    }

    return this.createSession(stored.userId);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    const stored = await this.refreshTokenRepository.findByHash(
      hashToken(refreshToken),
    );

    if (stored) await this.refreshTokenRepository.revoke(stored.id);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.authRepository.findById(userId);

    if (!user) throw new UnauthorizedError("Sessão inválida ou expirada");

    return user;
  }

  async loginWithGoogle(credential: string) {
    const profile = await verifyGoogleCredential(credential);

    const user =
      (await this.authRepository.findByGoogleId(profile.googleId)) ??
      (await this.authRepository.linkGoogleByEmail(
        profile.email,
        profile.googleId,
      )) ??
      (await this.createGoogleUser(profile));

    const session = await this.createSession(user.id);

    return { user, ...session };
  }

  private async createGoogleUser(profile: GoogleProfile) {
    const base = usernameFromEmail(profile.email);
    let user = base;

    for (let i = 1; await this.authRepository.usernameExists(user); i++) {
      user = `${base.slice(0, 30 - String(i).length)}${i}`;
    }

    return this.authRepository.createFromGoogle({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name.slice(0, 60).padEnd(3, "_"),
      user,
      userPhoto: await downloadPhoto(profile.picture),
    });
  }
}
