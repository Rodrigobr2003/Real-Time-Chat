import { z } from "zod";

// Mesmas regras do backend (UserController), para o usuário ver o erro
// antes de enviar. O backend continua validando: o front pode ser burlado.
export const registerSchema = z
  .object({
    user: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "O nome de usuário deve ter no mínimo 3 caracteres")
      .max(30, "O nome de usuário deve ter no máximo 30 caracteres")
      .regex(/^[a-z0-9._]+$/, "Use apenas letras minúsculas, números, '.' e '_'"),
    name: z
      .string()
      .trim()
      .min(3, "O nome deve ter no mínimo 3 caracteres")
      .max(60, "O nome deve ter no máximo 60 caracteres"),
    email: z.email("E-mail inválido").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .max(128, "A senha deve ter no máximo 128 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterForm = z.input<typeof registerSchema>;
export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

export const validateRegister = (form: RegisterForm) => {
  const parsed = registerSchema.safeParse(form);

  if (parsed.success) {
    const { user, name, email, password } = parsed.data;
    return { data: { user, name, email, password }, errors: {} as RegisterErrors };
  }

  const fieldErrors = z.flattenError(parsed.error).fieldErrors;
  const errors: RegisterErrors = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    errors[field as keyof RegisterForm] = messages?.[0];
  }

  return { data: null, errors };
};
