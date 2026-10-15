import { z } from "zod";

export const loginSchema = z.object({
  userOrEmail: z.string().trim().min(1, "Informe o usuário ou e-mail"),
  password: z.string().min(1, "Informe a senha"),
});
