import { Application, Router } from "express";
import { AuthController } from "@controllers/AuthController";
import { requireAuth } from "@middlewares/requireAuth";
import { AuthRepository } from "@repositories/AuthRepository";
import { AuthService } from "@services/AuthService";
import { RefreshTokenRepository } from "@repositories/RefreshTokenRepository";

const authRepository = new AuthRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const service = new AuthService(authRepository, refreshTokenRepository);
const controller = new AuthController(service);

const router = Router();

router.get("/me", requireAuth, controller.me);
router.post("/logout", controller.logout);

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth/private`, router);
