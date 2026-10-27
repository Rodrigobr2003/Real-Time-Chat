import { Router, type Application } from "express";
import { ChatController } from "@controllers/ChatController";
import { requireAuth } from "@middlewares/requireAuth";
import { uploadChatPhoto } from "@middlewares/uploadPhoto";
import { MongoChatRepository } from "@repositories/ChatRepository";
import { MongoPunishmentRepository } from "@repositories/PunishmentRepository";
import { ChatService } from "@services/ChatService";
import { MessageRepository } from "@repositories/MessageRepository";
import { realtimeHub } from "@services/RealtimeHub";

const repository = new MongoChatRepository();
const punishmentRepository = new MongoPunishmentRepository();
const messageRepository = new MessageRepository();

const service = new ChatService(
  repository,
  punishmentRepository,
  messageRepository,
  realtimeHub,
);

const controller = new ChatController(service);

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

router.get("/:chatId/messages", requireAuth, controller.listMessages);
router.post("/:chatId/messages", requireAuth, controller.sendMessage);
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

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}chats/private`, router);
