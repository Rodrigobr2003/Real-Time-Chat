import type { Request, Response } from "express";
import { z } from "zod";
import { ConflictError } from "@errors/ConflictError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InvalidImageError } from "@errors/InvalidImageError";
import type { ChatService } from "@services/ChatService";
import {
  chatParamsSchema,
  chatSchema,
  listChatsSchema,
  updateChatSchema,
} from "@validations/chat";

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  create = async (req: Request, res: Response) => {
    const parsed = chatSchema.safeParse({
      ...req.body,
      ...(req.file && { chatPhoto: req.file.buffer }),
    });

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const chat = await this.chatService.createChat(parsed.data);
      return res.status(201).json(chat);
    } catch (err) {
      if (err instanceof InvalidImageError) {
        return res.status(400).json({ errors: { chatPhoto: [err.message] } });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  update = async (req: Request, res: Response) => {
    const params = chatParamsSchema
      .pick({ chatId: true })
      .safeParse(req.params);
    const parsed = updateChatSchema.safeParse({
      ...req.body,
      ...(req.file && { chatPhoto: req.file.buffer }),
    });

    if (!params.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(params.error).fieldErrors });
    }

    if (!parsed.success) {
      const { formErrors, fieldErrors } = z.flattenError(parsed.error);
      return res
        .status(400)
        .json({ message: formErrors[0], errors: fieldErrors });
    }

    try {
      const chat = await this.chatService.updateChat({
        ...parsed.data,
        chatId: params.data.chatId,
      });

      if (!chat) {
        return res.status(404).json({ message: "Sala não encontrada" });
      }

      return res.status(200).json(chat);
    } catch (err) {
      if (err instanceof ConflictError) {
        return res
          .status(409)
          .json({ message: err.message, errors: { userLimit: [err.message] } });
      }

      if (err instanceof InvalidImageError) {
        return res.status(400).json({ errors: { chatPhoto: [err.message] } });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  delete = async (req: Request, res: Response) => {
    const parsed = chatParamsSchema
      .pick({ chatId: true })
      .safeParse(req.params);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const deleted = await this.chatService.delete(parsed.data.chatId);

      if (!deleted) {
        return res.status(404).json({ message: "Sala não encontrada" });
      }

      return res.status(200).json({ message: "Sala excluída" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  list = async (req: Request, res: Response) => {
    const parsed = listChatsSchema.safeParse(req.query);

    if (!parsed.success) {
      const { formErrors, fieldErrors } = z.flattenError(parsed.error);
      return res
        .status(400)
        .json({ message: formErrors[0], errors: fieldErrors });
    }

    try {
      const chats = await this.chatService.listChats(parsed.data);
      return res.status(200).json(chats);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  listConnectedUsers = async (req: Request, res: Response) => {
    const parsed = chatParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const users = await this.chatService.listConnectedUsers(
        parsed.data.chatId,
      );

      if (!users) {
        return res.status(404).json({ message: "Sala não encontrada" });
      }

      return res.status(200).json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  connect = async (req: Request, res: Response) => {
    const parsed = chatParamsSchema.safeParse({ ...req.body, ...req.params });

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const connected = await this.chatService.connectUser({
        accountId: req.userId!,
        chatId: parsed.data.chatId,
        password: parsed.data.password,
      });

      if (!connected) {
        return res
          .status(409)
          .json({ message: "Sala não encontrada ou sem vagas" });
      }

      return res.status(204).send();
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res
          .status(403)
          .json({ message: err.message, errors: { password: [err.message] } });
      }

      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  disconnect = async (req: Request, res: Response) => {
    const parsed = chatParamsSchema.safeParse({ ...req.body, ...req.params });

    if (!parsed.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(parsed.error).fieldErrors });
    }

    try {
      const disconnected = await this.chatService.disconnectUser({
        accountId: req.userId!,
        chatId: parsed.data.chatId,
      });

      if (!disconnected) {
        return res.status(409).json({ message: "Sala não encontrada" });
      }

      return res.status(200).json({ message: "Desconectado da sala" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  };
}
