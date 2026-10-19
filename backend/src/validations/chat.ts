import { z } from "zod";
import {
  CHAT_MAX_USERS,
  CHAT_MIN_USERS,
  CHAT_NAME_MAX_LENGTH,
  CHAT_NAME_MIN_LENGTH,
  CHAT_PASSWORD_MAX_LENGTH,
  CHAT_PASSWORD_MIN_LENGTH,
  CHAT_PRIVACY,
  HEX_COLOR_REGEX,
} from "@models/chatSchema";
import { PUNISHMENT_TYPES } from "@models/chatPunishmentSchema";

const LIST_DEFAULT_LIMIT = 20;
const LIST_MAX_LIMIT = 50;

const nameSchema = z
  .string()
  .trim()
  .min(
    CHAT_NAME_MIN_LENGTH,
    `O nome da sala deve ter no mínimo ${CHAT_NAME_MIN_LENGTH} caracteres`,
  )
  .max(
    CHAT_NAME_MAX_LENGTH,
    `O nome da sala deve ter no máximo ${CHAT_NAME_MAX_LENGTH} caracteres`,
  );
const userLimitSchema = z.coerce
  .number("Informe o limite de pessoas")
  .int("O limite de pessoas deve ser um número inteiro")
  .min(
    CHAT_MIN_USERS,
    `A sala deve permitir no mínimo ${CHAT_MIN_USERS} pessoas`,
  )
  .max(
    CHAT_MAX_USERS,
    `A sala deve permitir no máximo ${CHAT_MAX_USERS} pessoas`,
  );
const privacySchema = z.enum(CHAT_PRIVACY, "Privacidade inválida");
const chatBgColorSchema = z
  .string()
  .trim()
  .regex(HEX_COLOR_REGEX, "Cor inválida, use o formato hexadecimal (#RRGGBB)");
const chatPhotoSchema = z
  .instanceof(Buffer, { message: "Envie a foto como arquivo" })
  .nullable();
const passwordSchema = z
  .string("Informe a senha da sala")
  .min(
    CHAT_PASSWORD_MIN_LENGTH,
    `A senha deve ter no mínimo ${CHAT_PASSWORD_MIN_LENGTH} caracteres`,
  )
  .max(
    CHAT_PASSWORD_MAX_LENGTH,
    `A senha deve ter no máximo ${CHAT_PASSWORD_MAX_LENGTH} caracteres`,
  );
const usersCountSchema = z.coerce
  .number()
  .int()
  .min(1, "Quantidade de usuários deve ser maior que zero");

export const chatSchema = z
  .object({
    name: nameSchema,
    userLimit: userLimitSchema,
    privacy: privacySchema.optional(),
    chatBgColor: chatBgColorSchema.optional(),
    chatPhoto: chatPhotoSchema.optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => data.privacy !== "private" || !!data.password, {
    message: "Informe a senha da sala",
    path: ["password"],
  })
  .transform(({ password, ...data }) =>
    data.privacy === "private" ? { ...data, password } : data,
  );

export const updateChatSchema = z
  .strictObject({
    name: nameSchema,
    userLimit: userLimitSchema,
    privacy: privacySchema,
    chatBgColor: chatBgColorSchema,
    chatPhoto: chatPhotoSchema,
    password: passwordSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listChatsSchema = z
  .object({
    skip: z.coerce.number().int().min(0).default(0),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(LIST_MAX_LIMIT)
      .default(LIST_DEFAULT_LIMIT),
    privacy: privacySchema.optional(),
    minUsers: usersCountSchema.optional(),
    maxUsers: usersCountSchema.optional(),
    notFull: z
      .stringbool('"Com vagas" deve ser verdadeiro ou falso')
      .optional(),
    name: z.string().trim().max(CHAT_NAME_MAX_LENGTH).optional(),
  })
  .refine(
    ({ minUsers, maxUsers }) =>
      minUsers === undefined || maxUsers === undefined || minUsers <= maxUsers,
    {
      message:
        "Quantidade mínima de usuários não pode ser maior que a quantidade máxima",
      path: ["minUsers"],
    },
  );

export const chatParamsSchema = z.object({
  chatId: z.uuid("Sala inválida"),
  password: passwordSchema.optional(),
});

export const chatUserParamsSchema = z.object({
  chatId: z.uuid("Sala inválida"),
  userId: z.string().regex(/^[0-9a-f]{24}$/i, "Usuário inválido"),
});

export const punishBodySchema = z.object({
  type: z
    .enum(PUNISHMENT_TYPES, "Tipo de punição inválido")
    .default("temporary"),
});
