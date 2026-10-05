import { Router, type Application } from "express";
import { AuthController } from "@controllers/AuthController";
import { AuthRepository } from "@repositories/AuthRepository";
import { AuthService } from "@services/AuthService";
import { RefreshTokenRepository } from "@repositories/RefreshTokenRepository";

// Composição: repository -> service -> controller.
const authRepository = new AuthRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const service = new AuthService(authRepository, refreshTokenRepository);
const controller = new AuthController(service);

const router = Router();

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth/public`, router);
