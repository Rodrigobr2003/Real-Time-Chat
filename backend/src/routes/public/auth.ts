import { Router } from "express";
import express from "express";

const router = Router();

router.post("/login", (res: Response) => {
  res.status(501).json({ message: "Not implemented" });
});

export default (app: express.Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth`, router);
