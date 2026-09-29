import cors from "cors";
import express from "express";
import appRoutes from "@routes/routes";

const createServer = (): express.Application => {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(cors());

  appRoutes(app, "/v1/");

  return app;
};

export { createServer };
