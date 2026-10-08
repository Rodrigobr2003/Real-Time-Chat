import { Router, type Application } from "express";
import { UserController } from "@controllers/UserController";
import { requireAuth } from "@middlewares/requireAuth";
import { uploadUserPhoto } from "@middlewares/uploadUserPhoto";
import { MongoUserRepository } from "@repositories/UserRepository";
import { UserService } from "@services/UserService";

const repository = new MongoUserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

const router = Router();

router.patch("/update", requireAuth, uploadUserPhoto, controller.update);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}users/private`, router);
