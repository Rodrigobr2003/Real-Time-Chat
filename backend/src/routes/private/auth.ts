import { Router } from "express";
import express from "express";

const router = Router();

router.post("/login");

export default (app: express.Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth`, router);
