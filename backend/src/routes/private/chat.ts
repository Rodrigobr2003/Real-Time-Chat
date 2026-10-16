import { Router, type Application } from "express";
import { ChatController } from "@controllers/ChatController";
import { requireAuth } from "@middlewares/requireAuth";
import { uploadChatPhoto } from "@middlewares/uploadPhoto";
import { MongoChatRepository } from "@repositories/ChatRepository";
import { ChatService } from "@services/ChatService";

const repository = new MongoChatRepository();
const service = new ChatService(repository);
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

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}chats/private`, router);
