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

export const sendMessageBodySchema = messageBodySchema.extend({
  clientMessageId: z.uuid("Identificador da mensagem inválido"),
});

export const reactionBodySchema = z.object({
  emoji: z
    .string("Informe a reação")
    .trim()
    .min(1, "Informe a reação")
    .max(32, "Reação inválida"),
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

export const attachmentMessageBodySchema = z.object({
  content: z
    .string()
    .trim()
    .max(
      MESSAGE_MAX_LENGTH,
      `A legenda deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres`,
    )
    .optional()
    .transform((value) => value || undefined),
  clientMessageId: z.uuid("Identificador da mensagem inválido"),
});

export const attachmentParamsSchema = messageParamsSchema.extend({
  attachmentId: z.string().regex(/^[0-9a-f]{24}$/i, "Anexo inválido"),
});
