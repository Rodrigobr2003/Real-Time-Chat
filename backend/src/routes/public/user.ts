import { Router, type Application } from "express";
import { UserController } from "@controllers/UserController";
import { MongoUserRepository } from "@repositories/UserRepository";
import { UserService } from "@services/UserService";

const repository = new MongoUserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

const router = Router();

router.post("/", controller.create);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}users`, router);
