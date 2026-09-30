import type { Request, Response } from "express";
import { z } from "zod";
import { ConflictError } from "@errors/ConflictError";
import type { UserService } from "@services/UserService";

const createUserSchema = z.object({
  name: z.string().trim().min(3).max(60),
  user: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, '.' e '_'"),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const user = await this.userService.createUser(parsed.data);
      return res.status(201).json(user);
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };
}
