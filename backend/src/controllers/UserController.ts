import type { Request, Response } from "express";
import { z } from "zod";
import { ConflictError } from "@errors/ConflictError";
import { InvalidImageError } from "@errors/InvalidImageError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import type { UserService } from "@services/UserService";
import { createUserSchema, updateUserSchema } from "@validations/user";

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

  update = async (req: Request, res: Response) => {
    const parsed = updateUserSchema.safeParse({
      ...req.body,
      ...(req.file && { userPhoto: req.file.buffer }),
    });

    if (!parsed.success) {
      const { formErrors, fieldErrors } = z.flattenError(parsed.error);
      return res
        .status(400)
        .json({ message: formErrors[0], errors: fieldErrors });
    }

    try {
      const user = await this.userService.updateUser(req.userId!, parsed.data);
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({ message: err.message });
      }

      if (err instanceof UnauthorizedError) {
        return res.status(401).json({ message: err.message });
      }

      if (err instanceof InvalidImageError) {
        return res.status(400).json({ errors: { userPhoto: [err.message] } });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };
}
