import {
  MESSAGE_LIST_DEFAULT_LIMIT,
  MESSAGE_LIST_MAX_LIMIT,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
} from "@models/chatMessages";
import z from "zod";

export const messageSchema = z
  .string("Informe a mensagem")
  .trim()
  .min(
    MESSAGE_MIN_LENGTH,
    `A mensagem deve ter no mínimo ${MESSAGE_MIN_LENGTH} caracteres`,
  )
  .max(
    MESSAGE_MAX_LENGTH,
    `A mensagem deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres`,
  );

export const messageBodySchema = z.object({
  content: messageSchema,
});

export const messageParamsSchema = z.object({
  chatId: z.uuid("Sala inválida"),
  messageId: z.string().regex(/^[0-9a-f]{24}$/i, "Mensagem inválida"),
});

export const listMessagesSchema = z.object({
  before: z.coerce.date("Data inválida").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MESSAGE_LIST_MAX_LIMIT)
    .default(MESSAGE_LIST_DEFAULT_LIMIT),
});
