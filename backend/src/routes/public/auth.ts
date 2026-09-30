import { Router, type Application } from "express";

const router = Router();

router.post("/login", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default (app: Application, versionPrefix: string) =>
  app.use(`${versionPrefix}auth`, router);
