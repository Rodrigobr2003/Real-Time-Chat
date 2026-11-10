import type { NextFunction, Request, Response } from "express";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import { AttachmentError } from "@errors/AttachmentError";
import { ConflictError } from "@errors/ConflictError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { cleanupUploads } from "@middlewares/uploadAttachments";
import type { ChatService } from "@services/ChatService";
import { chatParamsSchema } from "@validations/chat";
import {
  attachmentMessageBodySchema,
  attachmentParamsSchema,
} from "@validations/message";

const chatIdSchema = chatParamsSchema.pick({ chatId: true });

const handleError = (err: unknown, res: Response) => {
  if (err instanceof AttachmentError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({ message: err.message });
  }

  if (err instanceof ConflictError) {
    return res.status(409).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
};

const contentDisposition = (name: string) => {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

export class AttachmentController {
  constructor(private readonly chatService: ChatService) {}

  authorize = async (req: Request, res: Response, next: NextFunction) => {
    const params = chatIdSchema.safeParse(req.params);

    if (!params.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(params.error).fieldErrors });
    }

    try {
      const exists = await this.chatService.assertCanSend({
        chatId: params.data.chatId,
        userId: req.userId!,
      });

      if (!exists) {
        return res.status(404).json({ message: "Sala não encontrada" });
      }

      next();
    } catch (err) {
      return handleError(err, res);
    }
  };

  send = async (req: Request, res: Response) => {
    try {
      const params = chatIdSchema.safeParse(req.params);
      const body = attachmentMessageBodySchema.safeParse(req.body ?? {});

      if (!params.success) {
        return res
          .status(400)
          .json({ errors: z.flattenError(params.error).fieldErrors });
      }

      if (!body.success) {
        return res
          .status(400)
          .json({ errors: z.flattenError(body.error).fieldErrors });
      }

      const files = Array.isArray(req.files) ? req.files : [];

      const result = await this.chatService.sendAttachmentMessage(
        {
          ...body.data,
          chatId: params.data.chatId,
          userId: req.userId!,
        },
        files,
      );

      if (!result) {
        return res.status(404).json({ message: "Sala não encontrada" });
      }

      return res.status(result.created ? 201 : 200).json(result.message);
    } catch (err) {
      return handleError(err, res);
    } finally {
      await cleanupUploads(req);
    }
  };

  download = async (req: Request, res: Response) => {
    const params = attachmentParamsSchema.safeParse(req.params);

    if (!params.success) {
      return res
        .status(400)
        .json({ errors: z.flattenError(params.error).fieldErrors });
    }

    try {
      const download = await this.chatService.openAttachment({
        ...params.data,
        userId: req.userId!,
      });

      if (!download) {
        return res.status(404).json({ message: "Anexo não encontrado" });
      }

      res.set({
        "Content-Type": download.mimeType,
        "Content-Length": String(download.size),
        "Content-Disposition": contentDisposition(download.name),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      });

      await pipeline(download.stream, res);
    } catch (err) {
      if (res.headersSent) {
        console.error(err);
        res.destroy();
        return;
      }

      return handleError(err, res);
    }
  };
}
