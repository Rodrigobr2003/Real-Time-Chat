import { Router, type Application } from "express";
import { AttachmentController } from "@controllers/AttachmentController";
import { ChatController } from "@controllers/ChatController";
import { requireAuth } from "@middlewares/requireAuth";
import { uploadAttachments } from "@middlewares/uploadAttachments";
import { uploadChatPhoto } from "@middlewares/uploadPhoto";
import { GridFSAttachmentStorageRepository } from "@repositories/AttachmentStorageRepository";
import { MongoChatRepository } from "@repositories/ChatRepository";
import { MongoPunishmentRepository } from "@repositories/PunishmentRepository";
import { ChatService } from "@services/ChatService";
import { MessageRepository } from "@repositories/MessageRepository";
import { AttachmentService } from "@services/AttachmentService";
import { realtimeHub } from "@services/RealtimeHub";

const repository = new MongoChatRepository();
const punishmentRepository = new MongoPunishmentRepository();
const messageRepository = new MessageRepository();
const attachmentStorage = new GridFSAttachmentStorageRepository();
const attachmentService = new AttachmentService(
  attachmentStorage,
  messageRepository,
);

const service = new ChatService(
  repository,
  punishmentRepository,
  messageRepository,
  realtimeHub,
  attachmentService,
);

const controller = new ChatController(service);
const attachmentController = new AttachmentController(service);

const router = Router();

router.post("/create", requireAuth, uploadChatPhoto, controller.create);
router.patch("/:chatId", requireAuth, uploadChatPhoto, controller.update);
router.delete("/:chatId", requireAuth, controller.delete);
router.get("/list", requireAuth, controller.list);
router.get(
  "/:chatId/connected-users",
  requireAuth,
  controller.listConnectedUsers,
);
router.patch("/:chatId/connect", requireAuth, controller.connect);
router.patch("/:chatId/disconnect", requireAuth, controller.disconnect);

router.get("/:chatId/blocked-users", requireAuth, controller.listBlockedUsers);
router.patch("/:chatId/users/:userId/kick", requireAuth, controller.kick);
router.patch("/:chatId/users/:userId/punish", requireAuth, controller.punish);
router.patch("/:chatId/users/:userId/unblock", requireAuth, controller.unblock);
router.patch(
  "/:chatId/users/:userId/promote",
  requireAuth,
  controller.promoteToAdmin,
);
router.patch(
  "/:chatId/users/:userId/demote",
  requireAuth,
  controller.demoteAdmin,
);

router.get("/:chatId/messages", requireAuth, controller.listMessages);
router.post("/:chatId/messages", requireAuth, controller.sendMessage);
router.post(
  "/:chatId/messages/attachments",
  requireAuth,
  attachmentController.authorize,
  uploadAttachments,
  attachmentController.send,
);
router.get(
  "/:chatId/messages/:messageId/attachments/:attachmentId",
  requireAuth,
  attachmentController.download,
);
router.patch(
  "/:chatId/messages/:messageId",
  requireAuth,
  controller.editMessage,
);
router.delete(
  "/:chatId/messages/:messageId",
  requireAuth,
  controller.deleteMessage,
);
router.patch(
  "/:chatId/messages/:messageId/reactions",
  requireAuth,
  controller.reactToMessage,
);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}chats/private`, router);
