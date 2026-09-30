import type { Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { AuthService } from "@services/AuthService";

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
      const user = await this.authService.login(parsed.data);

      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return res.status(401).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };
}
