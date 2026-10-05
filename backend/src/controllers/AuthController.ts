import type { Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { AuthService } from "@services/AuthService";
import { TOKEN_COOKIE, TOKEN_MAX_AGE_MS, tokenCookieOptions } from "@utils/jwt";
import { AuthSession } from "@typings/auth";
import {
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_MS,
  refreshCookieOptions,
} from "@utils/refreshToken";

const loginSchema = z.object({
  userOrEmail: z.string().trim().min(1, "Informe o usuário ou e-mail"),
  password: z.string().min(1, "Informe a senha"),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const { user, ...session } = await this.authService.login(parsed.data);

      this.setAuthCookies(res, session);

      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      await this.authService.logout(req.cookies?.[REFRESH_COOKIE]);
    } catch (err) {
      console.error(err);
    }

    this.clearAuthCookies(res);

    return res.status(204).end();
  };

  me = async (req: Request, res: Response) => {
    try {
      const user = await this.authService.me(req.userId!);

      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        this.clearAuthCookies(res);
        return res.status(401).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      const session = await this.authService.refresh(refreshToken);

      this.setAuthCookies(res, session);

      return res.status(200).json({ message: "Sessão renovada com sucesso" });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        this.clearAuthCookies(res);
        return res.status(401).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  private setAuthCookies = (res: Response, session: AuthSession) => {
    res.cookie(TOKEN_COOKIE, session.accessToken, {
      ...tokenCookieOptions,
      maxAge: TOKEN_MAX_AGE_MS,
    });

    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  };

  private clearAuthCookies = (res: Response) => {
    res.clearCookie(TOKEN_COOKIE, tokenCookieOptions);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  };
}
