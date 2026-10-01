import { Router, type Application } from "express";
import { AuthController } from "@controllers/AuthController";
import { AuthRepository } from "@repositories/AuthRepository";
import { AuthService } from "@services/AuthService";

// Composição: repository -> service -> controller.
const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

const router = Router();

router.post("/login", controller.login);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth/public`, router);
