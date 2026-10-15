import { z } from "zod";
import { USER_BACKGROUND_COLOR, USER_STATUS } from "@models/userSchema";

const nameSchema = z.string().trim().min(3).max(60);
const userSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, '.' e '_'");
const emailSchema = z.email().trim().toLowerCase();

export const createUserSchema = z.object({
  name: nameSchema,
  user: userSchema,
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const updateUserSchema = z
  .strictObject({
    name: nameSchema,
    user: userSchema,
    email: emailSchema,
    description: z.string().trim().max(280),
    status: z.enum(USER_STATUS),
    profileBgColor: z.enum(USER_BACKGROUND_COLOR, "Cor inválida"),
    userPhoto: z
      .instanceof(Buffer, { message: "Envie a foto como arquivo" })
      .nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });
