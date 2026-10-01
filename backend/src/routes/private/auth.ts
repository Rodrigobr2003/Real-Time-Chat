import { Application, Router } from "express";
import { AuthController } from "@controllers/AuthController";
import { AuthRepository } from "@repositories/AuthRepository";
import { AuthService } from "@services/AuthService";

const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

const router = Router();

router.post("/logout", controller.logout);

/**
 * Falta o ___refresh token___ para minar o problema do logout atual:
 * Apagar o cookie faz o navegador esquecer o token.
 * Mas o token em si continua válido até expirar.
 * Se alguém tivesse copiado o token antes do logout,
 * ainda conseguiria usá-lo até o fim do prazo.
 */

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth/private`, router);
